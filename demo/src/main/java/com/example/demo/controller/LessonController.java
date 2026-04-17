package com.example.demo.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import com.example.demo.entity.Lesson;
import com.example.demo.service.LessonService;

@RestController
public class LessonController {

    private final LessonService lessonService;

    public LessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @PostMapping("/admin/lesson")
    @PreAuthorize("hasRole('ADMIN')")
    public Lesson createAdminLesson(@RequestBody LessonRequest request) {
        Lesson lesson = new Lesson();
        lesson.setTitle(request.title());
        lesson.setContent(request.content());
        lesson.setOrderIndex(request.orderIndex());
        return lessonService.createLesson(request.moduleId(), lesson);
    }

    @GetMapping("/lesson/{id}")
    public Lesson getLessonById(@PathVariable Long id) {
        return lessonService.getLessonById(id);
    }

    public record LessonRequest(String title, String content, int orderIndex, Long moduleId) {}

    @PutMapping("/admin/lesson/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Lesson updateAdminLesson(@PathVariable Long id, @RequestBody LessonUpdateRequest request) {
        return lessonService.updateLesson(id, request.title(), request.content(), request.orderIndex());
    }

    @DeleteMapping("/admin/lesson/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteAdminLesson(@PathVariable Long id) {
        lessonService.deleteLesson(id);
        return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
    }

    public record LessonUpdateRequest(String title, String content, Integer orderIndex) {}
}
