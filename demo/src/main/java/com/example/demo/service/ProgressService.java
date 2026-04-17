package com.example.demo.service;

import com.example.demo.entity.Lesson;
import com.example.demo.entity.Progress;
import com.example.demo.entity.Student;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.ProgressRepository;
import com.example.demo.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public ProgressService(ProgressRepository progressRepository, StudentRepository studentRepository, LessonRepository lessonRepository) {
        this.progressRepository = progressRepository;
        this.studentRepository = studentRepository;
        this.lessonRepository = lessonRepository;
    }

    @Transactional
    public void markLessonComplete(String username, Long lessonId) {
        Student student = studentRepository.findByUser_Username(username)
                .orElseThrow(() -> new RuntimeException("Student not found for user: " + username));

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
                    .orElseThrow(() -> new RuntimeException("Lesson not found"));

            Progress progress = new Progress();
            progress.setStudent(student);
            progress.setLesson(lesson);
            progress.setCompleted(true);
            progress.setCompletedAt(LocalDateTime.now());
            progressRepository.save(progress);
        }
    }

    public Map<String, Object> getCourseProgress(String username, Long courseId) {
        Student student = studentRepository.findByUser_Username(username)
                .orElseThrow(() -> new RuntimeException("Student not found for user: " + username));

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
        Student student = studentRepository.findByUser_Username(username)
                .orElseThrow(() -> new RuntimeException("Student not found for user: " + username));

        List<Progress> progressList = progressRepository.findByStudentIdAndLesson_Module_Course_IdAndCompletedTrue(student.getId(), courseId);
        
        return progressList.stream()
                .map(p -> p.getLesson().getId())
                .collect(Collectors.toList());
    }
}
