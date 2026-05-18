package com.example.demo.dto;

import lombok.Data;

@Data
public class CourseResultDTO {
    private Integer totalScore;
    private Integer obtainedScore;
    private Double percentage;
    private String status; // PASS or FAIL
    private Long completedModulesCount;
    private Long totalModulesCount;
    private Long completedTasksCount;
    private Long totalTasksCount;
}
