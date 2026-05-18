package com.example.demo.controller;

import com.example.demo.service.ProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student/progress")
@PreAuthorize("hasRole('STUDENT')")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @PostMapping("/complete/{lessonId}")
    public ResponseEntity<Void> markLessonComplete(Authentication authentication, @PathVariable Long lessonId) {
        String username = authentication.getName();
        progressService.markLessonComplete(username, lessonId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<Map<String, Object>> getCourseProgress(Authentication authentication, @PathVariable Long courseId) {
        String username = authentication.getName();
        Map<String, Object> progress = progressService.getCourseProgress(username, courseId);
        return ResponseEntity.ok(progress);
    }

    @GetMapping("/completed/{courseId}")
    public ResponseEntity<List<Long>> getCompletedLessons(Authentication authentication, @PathVariable Long courseId) {
        String username = authentication.getName();
        List<Long> completedLessons = progressService.getCompletedLessons(username, courseId);
        return ResponseEntity.ok(completedLessons);
    }

    @GetMapping("/course/{courseId}/completion")
    public ResponseEntity<com.example.demo.dto.CourseResultDTO> getCourseCompletion(Authentication authentication, @PathVariable Long courseId) {
        String username = authentication.getName();
        com.example.demo.entity.Student student = progressService.resolveStudentPublic(username);
        com.example.demo.dto.CourseResultDTO result = progressService.getModuleTaskService().calculateCourseResult(student.getId(), courseId);
        return ResponseEntity.ok(result);
    }
}
