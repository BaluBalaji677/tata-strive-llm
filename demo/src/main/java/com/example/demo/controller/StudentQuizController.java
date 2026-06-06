package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import com.example.demo.dto.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/student/quizzes")
@PreAuthorize("hasRole('STUDENT')")
public class StudentQuizController {

    private static final Logger log = LoggerFactory.getLogger(StudentQuizController.class);

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuizAssignmentRepository quizAssignmentRepository;

    @Autowired
    private QuizSubmissionRepository quizSubmissionRepository;

    @Autowired
    private QuizAnswerRepository quizAnswerRepository;

    @Autowired
    private StudentRepository studentRepository;

    // Helper: Resolve current student from authentication context
    private Student getAuthenticatedStudent() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("[QUIZ ACCESS] Resolving student details for JWT username/rollNumber: {}", username);
        
        Optional<Student> studentOpt = studentRepository.findByRollNumber(username);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            log.info("[QUIZ ACCESS] Student profile found by Roll Number: {}, Student ID: {}", username, student.getId());
            return student;
        }
        
        studentOpt = studentRepository.findByUser_Username(username);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            log.info("[QUIZ ACCESS] Student profile found by User Username: {}, Student ID: {}, Student Roll Number: {}", 
                     username, student.getId(), student.getRollNumber());
            return student;
        }
        
        log.warn("[QUIZ ACCESS] Student profile lookup failed for JWT subject: {}. Returning HTTP 401", username);
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Student profile not found");
    }

    // 1. GET /student/quizzes: Retrieve active assigned quizzes with attempt statuses
    @GetMapping
    public ResponseEntity<List<StudentQuizResponse>> getStudentQuizzes() {
        Student student = getAuthenticatedStudent();

        List<QuizAssignment> assignments = quizAssignmentRepository.findByStudentAndTeacherMatches(student);
        List<StudentQuizResponse> responses = new ArrayList<>();

        for (QuizAssignment assignment : assignments) {
            Quiz quiz = assignment.getQuiz();
            // Show assigned quizzes, even if quiz was set to inactive later (to keep history)
            // or filter active for pending, but keep historic submissions.
            // Let's list active quizzes + quizzes that have submissions.
            boolean isCompleted = quizSubmissionRepository.existsByQuizAndStudent(quiz, student);
            
            // If the quiz is inactive AND the student has not attempted it, hide it.
            if (!quiz.getActive() && !isCompleted) {
                continue;
            }

            Optional<QuizSubmission> lastSubmission = quizSubmissionRepository.findFirstByQuizAndStudentOrderBySubmittedAtDesc(quiz, student);
            
            responses.add(new StudentQuizResponse(
                    quiz.getId(),
                    quiz.getTitle(),
                    quiz.getDescription(),
                    quiz.getCourse() != null ? quiz.getCourse().getTitle() : null,
                    isCompleted ? "COMPLETED" : "PENDING",
                    lastSubmission.map(QuizSubmission::getScore).orElse(null),
                    lastSubmission.map(QuizSubmission::getMaxScore).orElse(null),
                    lastSubmission.map(QuizSubmission::getSubmittedAt).orElse(null)
            ));
        }

        return ResponseEntity.ok(responses);
    }

    // 2. GET /student/quizzes/{id}: Retrieve quiz details & questions WITH correct answers MASKED
    // 2. GET /student/quizzes/{id}: Retrieve quiz details & questions WITH correct answers MASKED
    @GetMapping("/{id}")
    public ResponseEntity<QuizDetailsDto> getQuizById(@PathVariable Long id) {
        log.info("[QUIZ ACCESS] GET request for Quiz ID: {}", id);
        Student student = getAuthenticatedStudent();
        
        Quiz quiz = quizRepository.findById(id)
                .filter(Quiz::getActive)
                .orElseThrow(() -> {
                    log.error("[QUIZ ACCESS] Quiz ID: {} not found or inactive. Returning HTTP 404", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found or inactive");
                });

        // Enforce security: student can only query if quiz is assigned to them and created by their teacher
        boolean isAssigned = quizAssignmentRepository.existsByQuizAndStudentAndTeacherMatches(quiz, student);
        log.info("[QUIZ ACCESS] Verifying assignment. Student ID: {}, Roll Number: {}, Quiz ID: {}, Title: '{}'. Assigned={}", 
                 student.getId(), student.getRollNumber(), quiz.getId(), quiz.getTitle(), isAssigned);
        
        if (!isAssigned) {
            log.warn("[QUIZ ACCESS] Access Denied: Student ID: {} is not assigned or owner mismatch for Quiz ID: {}. Returning HTTP 403", 
                     student.getId(), quiz.getId());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to this quiz");
        }

        // Fetch questions and MASK the correct answers
        List<QuestionDto> questions = questionRepository.findByQuizId(quiz.getId()).stream()
                .map(q -> new QuestionDto(
                        q.getId(),
                        q.getQuestion(),
                        q.getOptionA(),
                        q.getOptionB(),
                        q.getOptionC(),
                        q.getOptionD(),
                        null // SECURE: Mask correct answer
                ))
                .collect(Collectors.toList());

        QuizDetailsDto response = QuizDetailsDto.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .courseId(quiz.getCourse() != null ? quiz.getCourse().getId() : null)
                .courseTitle(quiz.getCourse() != null ? quiz.getCourse().getTitle() : null)
                .allowMultipleSubmissions(quiz.getAllowMultipleSubmissions())
                .questions(questions)
                .build();

        log.info("[QUIZ ACCESS] GET request success. Quiz ID: {}, Title: '{}' questions count: {}. Returning HTTP 200", 
                 quiz.getId(), quiz.getTitle(), questions.size());
        return ResponseEntity.ok(response);
    }

    // 3. POST /student/quizzes/{id}/submit: Grade and submit choices on the backend
    @PostMapping("/{id}/submit")
    public ResponseEntity<StudentSubmitResultResponse> submitQuiz(
            @PathVariable Long id,
            @RequestBody StudentSubmitRequest request) {
        log.info("[QUIZ SUBMISSION] POST request to submit Quiz ID: {}", id);
        Student student = getAuthenticatedStudent();
        
        Quiz quiz = quizRepository.findById(id)
                .filter(Quiz::getActive)
                .orElseThrow(() -> {
                    log.error("[QUIZ SUBMISSION] Quiz ID: {} not found or inactive. Returning HTTP 404", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found or inactive");
                });

        // Enforce security: student can only submit if quiz is assigned to them and created by their teacher
        boolean isAssigned = quizAssignmentRepository.existsByQuizAndStudentAndTeacherMatches(quiz, student);
        log.info("[QUIZ SUBMISSION] Verifying assignment. Student ID: {}, Roll Number: {}, Quiz ID: {}. Assigned={}", 
                 student.getId(), student.getRollNumber(), quiz.getId(), isAssigned);
        
        if (!isAssigned) {
            log.warn("[QUIZ SUBMISSION] Access Denied: Student ID: {} is not assigned or owner mismatch for Quiz ID: {}. Returning HTTP 403", 
                     student.getId(), quiz.getId());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to this quiz");
        }

        // Enforce submission limits: check if a submission already exists and if multiples are disabled
        boolean alreadySubmitted = quizSubmissionRepository.existsByQuizAndStudent(quiz, student);
        log.info("[QUIZ SUBMISSION] Submission history check. Student ID: {}, Quiz ID: {}, AlreadySubmitted={}, AllowMultiples={}", 
                 student.getId(), quiz.getId(), alreadySubmitted, quiz.getAllowMultipleSubmissions());
        
        if (alreadySubmitted && !quiz.getAllowMultipleSubmissions()) {
            log.warn("[QUIZ SUBMISSION] Blocked duplicate submission: Student ID: {} already completed Quiz ID: {}. Returning HTTP 400", 
                     student.getId(), quiz.getId());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You have already submitted this quiz and multiple attempts are not allowed");
        }

        List<Question> questions = questionRepository.findByQuizId(quiz.getId());
        if (questions.isEmpty()) {
            log.error("[QUIZ SUBMISSION] Quiz ID: {} has no questions configured. Returning HTTP 400", quiz.getId());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz has no questions to grade");
        }

        // Grade on the backend
        int score = 0;
        Map<Long, String> studentAnswers = request.getAnswers(); // questionId -> selectedOption (A, B, C, D)
        List<QuizAnswer> answersToSave = new ArrayList<>();

        // Create submission first so answers can reference it
        QuizSubmission submission = new QuizSubmission();
        submission.setQuiz(quiz);
        submission.setStudent(student);
        submission.setMaxScore(questions.size());
        // Temporary score placeholder, will update after loop
        submission.setScore(0);
        submission.setSubmittedAt(LocalDateTime.now());
        QuizSubmission savedSubmission = quizSubmissionRepository.save(submission);

        for (Question q : questions) {
            String selectedOption = studentAnswers != null ? studentAnswers.get(q.getId()) : null;
            String normalizedSelected = selectedOption != null ? selectedOption.trim().toUpperCase() : "";

            String correctAnswer = q.getCorrectAnswer() != null ? q.getCorrectAnswer().trim().toUpperCase() : "";

            if (!normalizedSelected.isEmpty() && normalizedSelected.equals(correctAnswer)) {
                score++;
            }

            QuizAnswer answer = new QuizAnswer();
            answer.setSubmission(savedSubmission);
            answer.setQuestion(q);
            answer.setSelectedAnswer(normalizedSelected);
            answersToSave.add(answer);
        }

        // Update score
        savedSubmission.setScore(score);
        quizSubmissionRepository.save(savedSubmission);

        // Save detailed options
        quizAnswerRepository.saveAll(answersToSave);

        StudentSubmitResultResponse response = new StudentSubmitResultResponse(
                savedSubmission.getId(),
                score,
                questions.size(),
                savedSubmission.getSubmittedAt()
        );

        return ResponseEntity.ok(response);
    }

    // Helper records/DTOs
    public record StudentQuizResponse(
            Long quizId,
            String title,
            String description,
            String courseTitle,
            String status, // PENDING, COMPLETED
            Integer score,
            Integer maxScore,
            LocalDateTime submittedAt
    ) {}

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentSubmitRequest {
        private Map<Long, String> answers; // questionId -> selectedOption
    }

    public record StudentSubmitResultResponse(
            Long submissionId,
            Integer score,
            Integer maxScore,
            LocalDateTime submittedAt
    ) {}
}
