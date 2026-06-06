package com.example.demo.dto;

public record StudentManagementDTO(
        Long id,
        String rollNumber,
        String fullName,
        String status,
        String email,
        String username,
        Long courseId,
        String courseTitle,
        String teacherName
) {
}
