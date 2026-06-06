package com.example.demo.dto;

public record CourseSummaryDTO(
        Long id,
        String title,
        Integer duration,
        String description,
        String createdBy,
        Long teacherId,
        String teacherName,
        long assignedStudentsCount
) {
}
