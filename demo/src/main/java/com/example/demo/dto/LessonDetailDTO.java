package com.example.demo.dto;

public record LessonDetailDTO(
        Long id,
        String title,
        String content,
        int orderIndex
) {
}
