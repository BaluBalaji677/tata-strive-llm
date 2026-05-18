package com.example.demo.service;

import com.example.demo.entity.Course;
import com.example.demo.entity.Lesson;
import com.example.demo.entity.Progress;
import com.example.demo.entity.Student;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.ProgressRepository;
import com.example.demo.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProgressService {

    private final ProgressRepository progressRepository;
    private final StudentRepository studentRepository;
    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;
    private final ModuleTaskService moduleTaskService;

    @org.springframework.beans.factory.annotation.Autowired
    public ProgressService(ProgressRepository progressRepository, StudentRepository studentRepository, LessonRepository lessonRepository, CourseRepository courseRepository, @org.springframework.context.annotation.Lazy ModuleTaskService moduleTaskService) {
        this.progressRepository = progressRepository;
        this.studentRepository = studentRepository;
        this.lessonRepository = lessonRepository;
        this.courseRepository = courseRepository;
        this.moduleTaskService = moduleTaskService;
    }

    @Transactional
    public void markLessonComplete(String username, Long lessonId) {
        Student student = resolveStudent(username);

        Optional<Progress> existingProgress = progressRepository.findByStudentIdAndLessonId(student.getId(), lessonId);

        if (existingProgress.isPresent()) {
            Progress progress = existingProgress.get();
            if (!progress.isCompleted()) {
                progress.setCompleted(true);
                progress.setCompletedAt(LocalDateTime.now());
                progressRepository.save(progress);
            }
        } else {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

            Progress progress = new Progress();
            progress.setStudent(student);
            progress.setLesson(lesson);
            progress.setCompleted(true);
            progress.setCompletedAt(LocalDateTime.now());
            progressRepository.save(progress);
        }
    }

    public Map<String, Object> getCourseProgress(String username, Long courseId) {
        Student student = resolveStudent(username);

        long totalLessons = progressRepository.countTotalLessonsByCourseId(courseId);
        long completedLessons = progressRepository.countCompletedLessonsByStudentAndCourse(student.getId(), courseId);

        long percentage = totalLessons > 0 ? (completedLessons * 100) / totalLessons : 0;

        Map<String, Object> progress = new HashMap<>();
        progress.put("totalLessons", totalLessons);
        progress.put("completedLessons", completedLessons);
        progress.put("percentage", percentage);

        return progress;
    }

    public List<Long> getCompletedLessons(String username, Long courseId) {
        Student student = resolveStudent(username);

        List<Progress> progressList = progressRepository.findByStudentIdAndLesson_Module_Course_IdAndCompletedTrue(student.getId(), courseId);
        
        return progressList.stream()
                .map(p -> p.getLesson().getId())
                .collect(Collectors.toList());
    }

    public List<StudentCourseProgress> getStudentCourseProgress() {
        List<Student> students = studentRepository.findAllWithUser();
        List<Course> courses = courseRepository.findAll();

        return students.stream()
                .map(student -> {
                    List<CourseProgress> courseProgress = courses.stream()
                            .map(course -> {
                                long totalLessons = progressRepository.countTotalLessonsByCourseId(course.getId());
                                long completedLessons = totalLessons > 0
                                        ? progressRepository.countCompletedLessonsByStudentAndCourse(student.getId(), course.getId())
                                        : 0;
                                long percentage = totalLessons > 0 ? (completedLessons * 100) / totalLessons : 0;
                                return new CourseProgress(
                                        course.getId(),
                                        course.getTitle(),
                                        completedLessons,
                                        totalLessons,
                                        percentage
                                );
                            })
                            .toList();

                    return new StudentCourseProgress(
                            student.getId(),
                            student.getFullName(),
                            student.getRollNumber(),
                            student.getUser() != null ? student.getUser().getUsername() : null,
                            courseProgress
                    );
                })
                .toList();
    }

    public record StudentCourseProgress(
            Long studentId,
            String fullName,
            String rollNumber,
            String username,
            List<CourseProgress> courses
    ) {}

    public record CourseProgress(
            Long courseId,
            String courseTitle,
            long completedLessons,
            long totalLessons,
            long percentage
    ) {}

    public Student resolveStudentPublic(String username) {
        return resolveStudent(username);
    }

    private Student resolveStudent(String username) {
        return studentRepository.findByUser_Username(username)
                .or(() -> studentRepository.findByRollNumber(username))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Student not found for identifier: " + username));
    }

    public ModuleTaskService getModuleTaskService() {
        return this.moduleTaskService;
    }
}
