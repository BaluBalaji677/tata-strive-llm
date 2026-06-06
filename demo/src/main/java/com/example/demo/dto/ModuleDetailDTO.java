package com.example.demo.dto;

import java.util.List;

public record ModuleDetailDTO(
        Long id,
        String title,
        List<LessonDetailDTO> lessons
) {
}
