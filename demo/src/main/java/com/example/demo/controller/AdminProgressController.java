package com.example.demo.controller;

import com.example.demo.service.ProgressService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/student-progress")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProgressController {

    private final ProgressService progressService;

    public AdminProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping
    public List<ProgressService.StudentCourseProgress> getStudentProgress() {
        return progressService.getStudentCourseProgress();
    }
}
