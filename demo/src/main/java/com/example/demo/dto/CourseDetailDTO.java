package com.example.demo.dto;

import java.util.List;

public record CourseDetailDTO(
        Long id,
        String title,
        Integer duration,
        String description,
        String createdBy,
        Long teacherId,
        String teacherName,
        long assignedStudentsCount,
        List<ModuleDetailDTO> modules
) {
}
