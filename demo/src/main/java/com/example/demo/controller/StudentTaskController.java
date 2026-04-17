package com.example.demo.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.CourseDay;
import com.example.demo.service.StudentTaskService;

@RestController
public class StudentTaskController {

    private final StudentTaskService taskService;

    public StudentTaskController(StudentTaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/student/tasks")
    public ResponseEntity<List<CourseDayTaskResponse>> getTasks() {
        List<CourseDay> days = taskService.getAllTasks();
        return ResponseEntity.ok(days.stream().map(this::toResponse).toList());
    }

    private CourseDayTaskResponse toResponse(CourseDay cd) {
        return new CourseDayTaskResponse(
                cd.getId(),
                cd.getDayNumber(),
                cd.getTopic(),
                cd.getVideoUrl()
        );
    }

    public record CourseDayTaskResponse(
            Long id,
            int dayNumber,
            String topic,
            String task
    ) {}
}

