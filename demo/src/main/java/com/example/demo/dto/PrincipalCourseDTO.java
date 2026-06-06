package com.example.demo.dto;

public record PrincipalCourseDTO(
        Long id,
        String title,
        Integer duration,
        String description,
        String createdBy
) {
}
