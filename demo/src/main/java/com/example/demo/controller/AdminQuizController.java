package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import com.example.demo.service.TeacherAccessService;
import com.example.demo.dto.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/quizzes")
@PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
public class AdminQuizController {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuizAssignmentRepository quizAssignmentRepository;

    @Autowired
    private QuizSubmissionRepository quizSubmissionRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private TeacherAccessService teacherAccessService;

    // 1. GET /admin/quizzes: Paginated, filtered list of quizzes
    @GetMapping
    public ResponseEntity<Page<QuizDetailsDto>> getQuizzes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Long courseId) {

        User currentUser = teacherAccessService.requireCurrentUser();
        boolean isPrincipal = "PRINCIPAL".equals(currentUser.getRole().name());

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Quiz> quizzes = quizRepository.findAll((root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("active"), true));

            if (title != null && !title.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%"));
            }

            if (courseId != null) {
                predicates.add(cb.equal(root.get("course").get("id"), courseId));
            }

            if (!isPrincipal) {
                predicates.add(cb.equal(root.get("createdBy").get("id"), currentUser.getId()));
            }

            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        }, pageable);

        Page<QuizDetailsDto> dtos = quizzes.map(this::mapToDetailsDto);
        return ResponseEntity.ok(dtos);
    }

    // 2. GET /admin/quizzes/{id}: Retrieve detailed quiz with questions
    @GetMapping("/{id}")
    public ResponseEntity<QuizDetailsDto> getQuizById(@PathVariable @NonNull Long id) {
        User currentUser = teacherAccessService.requireCurrentUser();
        Quiz quiz = quizRepository.findById(id)
                .filter(Quiz::getActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));

        if (!"PRINCIPAL".equals(currentUser.getRole().name()) && quiz.getCreatedBy() != null) {
            if (!quiz.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this quiz");
            }
        }

        return ResponseEntity.ok(mapToDetailsDto(quiz));
    }

    // 3. POST /admin/quizzes: Create a quiz and questions, and assign them
    @PostMapping
    public ResponseEntity<Quiz> createQuiz(@RequestBody CreateQuizRequest request) {
        User currentUser = teacherAccessService.requireCurrentUser();

        Quiz quiz = new Quiz();
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setAllowMultipleSubmissions(request.getAllowMultipleSubmissions() != null && request.getAllowMultipleSubmissions());
        quiz.setCreatedBy(currentUser);
        quiz.setActive(true);

        Long courseId = request.getCourseId();
        if (courseId != null) {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course not found"));
            quiz.setCourse(course);
        }

        Quiz savedQuiz = quizRepository.save(quiz);

        // Save questions
        if (request.getQuestions() != null) {
            for (QuestionDto qDto : request.getQuestions()) {
                Question q = new Question();
                q.setQuiz(savedQuiz);
                q.setQuestion(qDto.getQuestion());
                q.setOptionA(qDto.getOptionA());
                q.setOptionB(qDto.getOptionB());
                q.setOptionC(qDto.getOptionC());
                q.setOptionD(qDto.getOptionD());
                q.setCorrectAnswer(qDto.getCorrectAnswer());
                questionRepository.save(q);
            }
        }

        // Perform Assignments
        processAssignments(savedQuiz, request.getAssignTo(), courseId, request.getStudentId(), currentUser);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedQuiz);
    }

    // 4. PUT /admin/quizzes/{id}: Update quiz metadata and questions list
    @PutMapping("/{id}")
    public ResponseEntity<Quiz> updateQuiz(@PathVariable @NonNull Long id, @RequestBody UpdateQuizRequest request) {
        User currentUser = teacherAccessService.requireCurrentUser();
        Quiz quiz = quizRepository.findById(id)
                .filter(Quiz::getActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));

        if (!"PRINCIPAL".equals(currentUser.getRole().name()) && quiz.getCreatedBy() != null) {
            if (!quiz.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this quiz");
            }
        }

        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        if (request.getAllowMultipleSubmissions() != null) {
            quiz.setAllowMultipleSubmissions(request.getAllowMultipleSubmissions());
        }

        Quiz savedQuiz = quizRepository.save(quiz);

        // Fetch existing questions
        List<Question> existingQuestions = questionRepository.findByQuizId(id);
        Map<Long, Question> existingMap = existingQuestions.stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        Set<Long> updatedIds = new HashSet<>();

        if (request.getQuestions() != null) {
            for (QuestionDto qDto : request.getQuestions()) {
                if (qDto.getId() != null && existingMap.containsKey(qDto.getId())) {
                    // Update existing question
                    Question q = existingMap.get(qDto.getId());
                    q.setQuestion(qDto.getQuestion());
                    q.setOptionA(qDto.getOptionA());
                    q.setOptionB(qDto.getOptionB());
                    q.setOptionC(qDto.getOptionC());
                    q.setOptionD(qDto.getOptionD());
                    q.setCorrectAnswer(qDto.getCorrectAnswer());
                    questionRepository.save(q);
                    updatedIds.add(q.getId());
                } else {
                    // Create new question
                    Question q = new Question();
                    q.setQuiz(savedQuiz);
                    q.setQuestion(qDto.getQuestion());
                    q.setOptionA(qDto.getOptionA());
                    q.setOptionB(qDto.getOptionB());
                    q.setOptionC(qDto.getOptionC());
                    q.setOptionD(qDto.getOptionD());
                    q.setCorrectAnswer(qDto.getCorrectAnswer());
                    questionRepository.save(q);
                }
            }
        }

        // Delete questions not in the request payload
        for (Question q : existingQuestions) {
            if (!updatedIds.contains(q.getId())) {
                questionRepository.delete(q);
            }
        }

        return ResponseEntity.ok(savedQuiz);
    }

    // 5. DELETE /admin/quizzes/{id}: Soft delete quiz
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable @NonNull Long id) {
        User currentUser = teacherAccessService.requireCurrentUser();
        Quiz quiz = quizRepository.findById(id)
                .filter(Quiz::getActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));

        if (!"PRINCIPAL".equals(currentUser.getRole().name()) && quiz.getCreatedBy() != null) {
            if (!quiz.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this quiz");
            }
        }

        quiz.setActive(false);
        quizRepository.save(quiz);
        return ResponseEntity.noContent().build();
    }

    // 6. GET /admin/quizzes/submissions: Retrieve student submissions
    @GetMapping("/submissions")
    public ResponseEntity<Page<SubmissionResponse>> getSubmissions(
            @RequestParam(required = false) Long quizId,
            @RequestParam(required = false) Long studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        User currentUser = teacherAccessService.requireCurrentUser();
        boolean isPrincipal = "PRINCIPAL".equals(currentUser.getRole().name());

        if (quizId != null) {
            Quiz quiz = quizRepository.findById(quizId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));
            if (!isPrincipal && quiz.getCreatedBy() != null) {
                if (!quiz.getCreatedBy().getId().equals(currentUser.getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this quiz's submissions");
                }
            }
        }

        Long filterCreatedById = isPrincipal ? null : currentUser.getId();

        Pageable pageable = PageRequest.of(page, size, Sort.by("submittedAt").descending());
        Page<QuizSubmission> submissions = quizSubmissionRepository.findFilteredSubmissions(quizId, studentId, filterCreatedById, pageable);
        
        Page<SubmissionResponse> response = submissions.map(s -> new SubmissionResponse(
                s.getId(),
                s.getQuiz().getId(),
                s.getQuiz().getTitle(),
                s.getStudent().getId(),
                s.getStudent().getFullName(),
                s.getStudent().getRollNumber(),
                s.getScore(),
                s.getMaxScore(),
                s.getSubmittedAt()
        ));

        return ResponseEntity.ok(response);
    }

    // 7. GET /admin/quizzes/{id}/analytics: Quiz attempt statistics
    @GetMapping("/{id}/analytics")
    public ResponseEntity<QuizAnalyticsResponse> getQuizAnalytics(@PathVariable @NonNull Long id) {
        User currentUser = teacherAccessService.requireCurrentUser();
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));

        if (!"PRINCIPAL".equals(currentUser.getRole().name()) && quiz.getCreatedBy() != null) {
            if (!quiz.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this quiz");
            }
        }

        long totalAssigned = quizAssignmentRepository.findAll().stream()
                .filter(qa -> qa.getQuiz().getId().equals(id))
                .count();

        long totalSubmitted = quizSubmissionRepository.findByQuiz(quiz).size();

        Double avgScore = quizSubmissionRepository.findAverageScoreByQuizId(id);
        Integer maxScore = quizSubmissionRepository.findMaxScoreByQuizId(id);
        Integer minScore = quizSubmissionRepository.findMinScoreByQuizId(id);

        QuizAnalyticsResponse response = new QuizAnalyticsResponse(
                quiz.getId(),
                quiz.getTitle(),
                totalAssigned,
                totalSubmitted,
                avgScore != null ? avgScore : 0.0,
                maxScore != null ? maxScore : 0,
                minScore != null ? minScore : 0
        );

        return ResponseEntity.ok(response);
    }

    // Helper: Map Quiz entity to QuizDetailsDto
    private QuizDetailsDto mapToDetailsDto(Quiz quiz) {
        List<QuestionDto> questions = questionRepository.findByQuizId(quiz.getId()).stream()
                .map(q -> new QuestionDto(
                        q.getId(),
                        q.getQuestion(),
                        q.getOptionA(),
                        q.getOptionB(),
                        q.getOptionC(),
                        q.getOptionD(),
                        q.getCorrectAnswer()
                ))
                .collect(Collectors.toList());

        return QuizDetailsDto.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .courseId(quiz.getCourse() != null ? quiz.getCourse().getId() : null)
                .courseTitle(quiz.getCourse() != null ? quiz.getCourse().getTitle() : null)
                .allowMultipleSubmissions(quiz.getAllowMultipleSubmissions())
                .questions(questions)
                .build();
    }

    // Helper: Process quiz assignments
    private void processAssignments(Quiz quiz, String assignTo, Long courseId, Long studentId, User currentUser) {
        List<Student> targets = new ArrayList<>();
        boolean isPrincipal = "PRINCIPAL".equals(currentUser.getRole().name());

        if ("SINGLE".equalsIgnoreCase(assignTo) && studentId != null) {
            Student s = studentRepository.findById(studentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
            
            boolean hasPermission = isPrincipal || 
                    (s.getCourse() != null && s.getCourse().getTeacher() != null && 
                     s.getCourse().getTeacher().getId().equals(currentUser.getId()));
            
            if (!hasPermission) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only assign quizzes to students in your own courses");
            }
            targets.add(s);
        } else if ("COURSE".equalsIgnoreCase(assignTo) && courseId != null) {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
            
            boolean hasPermission = isPrincipal || 
                    (course.getTeacher() != null && course.getTeacher().getId().equals(currentUser.getId()));
            
            if (!hasPermission) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only assign quizzes to courses you teach");
            }
            
            targets = studentRepository.findAll().stream()
                    .filter(s -> s.getCourse() != null && s.getCourse().getId().equals(courseId))
                    .collect(Collectors.toList());
        } else if ("ALL".equalsIgnoreCase(assignTo)) {
            if (isPrincipal) {
                targets = studentRepository.findAll();
            } else {
                targets = studentRepository.findByCourse_Teacher_Id(currentUser.getId());
            }
        }

        for (Student s : targets) {
            // Prevent duplicate assignments
            if (!quizAssignmentRepository.existsByQuizAndStudent(quiz, s)) {
                QuizAssignment assignment = new QuizAssignment();
                assignment.setQuiz(quiz);
                assignment.setStudent(s);
                assignment.setAssignedAt(LocalDateTime.now());
                quizAssignmentRepository.save(assignment);
            }
        }
    }

    // Request & Response helper classes
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateQuizRequest {
        private String title;
        private String description;
        private Long courseId;
        private Boolean allowMultipleSubmissions;
        private List<QuestionDto> questions;
        private String assignTo; // SINGLE, COURSE, ALL
        private Long studentId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateQuizRequest {
        private String title;
        private String description;
        private Boolean allowMultipleSubmissions;
        private List<QuestionDto> questions;
    }

    public record SubmissionResponse(
            Long submissionId,
            Long quizId,
            String quizTitle,
            Long studentId,
            String studentName,
            String studentRollNumber,
            Integer score,
            Integer maxScore,
            LocalDateTime submittedAt
    ) {}

    public record QuizAnalyticsResponse(
            Long quizId,
            String quizTitle,
            long totalAssigned,
            long totalSubmitted,
            double averageScore,
            int highestScore,
            int lowestScore
    ) {}
}
