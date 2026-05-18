package com.example.demo.controller;

import com.example.demo.dto.ModuleTaskDTO;
import com.example.demo.entity.ModuleTask;
import com.example.demo.entity.ModuleTaskSubmission;
import com.example.demo.entity.ModuleTaskTestCase;
import com.example.demo.service.ModuleTaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ModuleTaskController {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(ModuleTaskController.class);

    private final ModuleTaskService moduleTaskService;
    private final com.example.demo.repository.StudentRepository studentRepository;

    public ModuleTaskController(ModuleTaskService moduleTaskService, com.example.demo.repository.StudentRepository studentRepository) {
        this.moduleTaskService = moduleTaskService;
        this.studentRepository = studentRepository;
    }

    public record CreateTaskRequest(Long moduleId, String title, String description, String language, Integer maxScore, String difficulty, List<TestCaseDto> testCases) {}
    public record TestCaseDto(String input, String expectedOutput, Boolean isHidden) {}
    public record UpdateTaskRequest(String title, String description, String language, Integer maxScore, String difficulty, List<TestCaseDto> testCases) {}

    private List<ModuleTaskTestCase> mapTestCases(List<TestCaseDto> requestTestCases) {
        List<TestCaseDto> safeCases = requestTestCases != null ? requestTestCases : List.of();
        return safeCases.stream().map(dto -> {
            ModuleTaskTestCase tc = new ModuleTaskTestCase();
            tc.setInput(dto.input());
            tc.setExpectedOutput(dto.expectedOutput());
            if (dto.isHidden() != null) {
                tc.setHidden(dto.isHidden());
            }
            return tc;
        }).toList();
    }

    @PostMapping("/tasks")
    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL')")
    public ResponseEntity<ModuleTaskDTO> createTask(@RequestBody CreateTaskRequest request) {
        logger.info("Create task request received for moduleId={} title={}", request.moduleId(), request.title());

        ModuleTask task = moduleTaskService.createTask(
                request.moduleId(),
                request.title(),
                request.description(),
                request.language(),
                request.maxScore(),
                request.difficulty(),
                mapTestCases(request.testCases())
        );
        ModuleTaskDTO response = ModuleTaskDTO.fromEntity(task, moduleTaskService.getSubmissionCount(task.getId()));
        logger.info("Created task response: {}", response);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tasks/module/{moduleId}")
    public ResponseEntity<List<ModuleTaskDTO>> getTasksByModule(@PathVariable Long moduleId) {
        List<ModuleTaskDTO> tasks = moduleTaskService.getTasksByModule(moduleId).stream()
                .map(task -> ModuleTaskDTO.fromEntity(task, moduleTaskService.getSubmissionCount(task.getId())))
                .toList();
        logger.info("Fetched tasks response for moduleId={} count={}", moduleId, tasks.size());
        return ResponseEntity.ok(tasks);
    }

    @PutMapping("/tasks/{taskId}")
    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL')")
    public ResponseEntity<ModuleTaskDTO> updateTask(@PathVariable Long taskId, @RequestBody UpdateTaskRequest request) {
        ModuleTask updatedTask = moduleTaskService.updateTask(
                taskId,
                request.title(),
                request.description(),
                request.language(),
                request.maxScore(),
                request.difficulty(),
                mapTestCases(request.testCases())
        );
        return ResponseEntity.ok(ModuleTaskDTO.fromEntity(updatedTask, moduleTaskService.getSubmissionCount(taskId)));
    }

    @DeleteMapping("/tasks/{taskId}")
    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL')")
    public ResponseEntity<Void> deleteTask(@PathVariable Long taskId) {
        moduleTaskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }

    public record SubmitCodeRequest(Long studentId, Long taskId, String code) {}

    @PostMapping("/submissions")
    public ResponseEntity<com.example.demo.dto.ModuleTaskSubmissionDTO> submitCode(@RequestBody SubmitCodeRequest request) {
        ModuleTaskSubmission submission = moduleTaskService.submitCode(request.studentId(), request.taskId(), request.code());
        return ResponseEntity.ok(com.example.demo.dto.ModuleTaskSubmissionDTO.fromEntity(submission));
    }

    @GetMapping("/submissions/student/{studentId}")
    public ResponseEntity<List<com.example.demo.dto.ModuleTaskSubmissionDTO>> getSubmissionsByStudent(@PathVariable Long studentId) {
        List<ModuleTaskSubmission> submissions = moduleTaskService.getSubmissionsByStudent(studentId);
        List<com.example.demo.dto.ModuleTaskSubmissionDTO> dtos = submissions.stream()
                .map(com.example.demo.dto.ModuleTaskSubmissionDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/modules/{moduleId}/status")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Map<String, Boolean>> getModuleStatus(Authentication authentication, @PathVariable Long moduleId) {
        try {
            if (authentication == null || authentication.getName() == null) {
                logger.warn("Authentication or username is null for module status check");
                return ResponseEntity.ok(Map.of("completed", false));
            }

            String username = authentication.getName();
            
            // For student, the principal username might be the roll number.
            com.example.demo.entity.Student student = studentRepository.findByRollNumber(username)
                    .orElseGet(() -> studentRepository.findByUser_Username(username).orElse(null));

            if (student == null) {
                logger.warn("Student not found for username/rollNumber: {}", username);
                return ResponseEntity.ok(Map.of("completed", false));
            }

            boolean allPassed = moduleTaskService.isModuleCompleted(student.getId(), moduleId);

            return ResponseEntity.ok(Map.of("completed", allPassed));
        } catch (Exception e) {
            logger.error("Error evaluating module status for moduleId: {}", moduleId, e);
            return ResponseEntity.ok(Map.of("completed", false));
        }
    }

    @GetMapping("/admin/analytics/tasks")
    public ResponseEntity<List<Map<String, Object>>> getTaskAnalytics() {
        // Find all tasks
        List<ModuleTask> allTasks = moduleTaskService.getAllTasks();
        List<Map<String, Object>> analytics = new java.util.ArrayList<>();
        
        for (ModuleTask task : allTasks) {
            List<ModuleTaskSubmission> subs = moduleTaskService.getSubmissionsByTaskId(task.getId());
            long totalSubmissions = subs.size();
            long passedSubmissions = subs.stream().filter(s -> "PASS".equals(s.getStatus())).count();
            double avgScore = subs.stream().mapToInt(s -> s.getScore() != null ? s.getScore() : 0).average().orElse(0.0);
            double avgTime = subs.stream().mapToLong(s -> s.getExecutionTimeMs() != null ? s.getExecutionTimeMs() : 0).average().orElse(0.0);
            
            long uniqueStudentsPassed = subs.stream()
                .filter(s -> "PASS".equals(s.getStatus()))
                .map(s -> s.getStudent().getId())
                .distinct()
                .count();

            analytics.add(Map.of(
                "taskId", task.getId(),
                "title", task.getTitle(),
                "difficulty", task.getDifficulty() != null ? task.getDifficulty() : "N/A",
                "totalSubmissions", totalSubmissions,
                "passedSubmissions", passedSubmissions,
                "uniqueStudentsPassed", uniqueStudentsPassed,
                "averageScore", Math.round(avgScore * 10.0) / 10.0,
                "averageExecutionTimeMs", Math.round(avgTime)
            ));
        }
        
        return ResponseEntity.ok(analytics);
    }
}
