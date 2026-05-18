package com.example.demo.dto;

import com.example.demo.entity.ModuleTask;
import com.example.demo.entity.ModuleTaskTestCase;

import java.util.List;

public record ModuleTaskDTO(
        Long id,
        Long moduleId,
        String title,
        String description,
        String language,
        Integer maxScore,
        String difficulty,
        Long submissionCount,
        List<TestCaseDTO> testCases
) {
    public record TestCaseDTO(Long id, String input, String expectedOutput, Boolean isHidden) {
        public static TestCaseDTO fromEntity(ModuleTaskTestCase testCase) {
            if (testCase == null) {
                return null;
            }

            return new TestCaseDTO(
                    testCase.getId(),
                    testCase.getInput(),
                    testCase.getExpectedOutput(),
                    testCase.isHidden()
            );
        }
    }

    public static ModuleTaskDTO fromEntity(ModuleTask task) {
        return fromEntity(task, 0L);
    }

    public static ModuleTaskDTO fromEntity(ModuleTask task, Long submissionCount) {
        if (task == null) {
            return null;
        }

        Long moduleId = task.getModule() != null ? task.getModule().getId() : null;
        List<TestCaseDTO> testCases = task.getTestCases() == null
                ? List.of()
                : task.getTestCases().stream().map(TestCaseDTO::fromEntity).toList();

        return new ModuleTaskDTO(
                task.getId(),
                moduleId,
                task.getTitle(),
                task.getDescription(),
                task.getLanguage(),
                task.getMaxScore(),
                task.getDifficulty(),
                submissionCount == null ? 0L : submissionCount,
                testCases
        );
    }
}
