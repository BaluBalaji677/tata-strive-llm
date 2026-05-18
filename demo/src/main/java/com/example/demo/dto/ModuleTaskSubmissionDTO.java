package com.example.demo.dto;

import com.example.demo.entity.ModuleTaskSubmission;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ModuleTaskSubmissionDTO {
    private Long id;
    private String status;
    private Integer score;
    private String feedback;
    private String code;
    private LocalDateTime submittedAt;
    private SimpleTaskDTO moduleTask;

    @Data
    public static class SimpleTaskDTO {
        private Long id;
        private String title;
    }

    public static ModuleTaskSubmissionDTO fromEntity(ModuleTaskSubmission submission) {
        if (submission == null) return null;

        ModuleTaskSubmissionDTO dto = new ModuleTaskSubmissionDTO();
        dto.setId(submission.getId());
        dto.setStatus(submission.getStatus());
        dto.setScore(submission.getScore());
        dto.setFeedback(submission.getFeedback());
        dto.setCode(submission.getCode());
        dto.setSubmittedAt(submission.getSubmittedAt());

        if (submission.getModuleTask() != null) {
            SimpleTaskDTO taskDto = new SimpleTaskDTO();
            taskDto.setId(submission.getModuleTask().getId());
            taskDto.setTitle(submission.getModuleTask().getTitle());
            dto.setModuleTask(taskDto);
        }

        return dto;
    }
}
