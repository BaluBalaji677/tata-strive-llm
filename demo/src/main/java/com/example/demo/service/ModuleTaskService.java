package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.dto.ModuleTaskDTO;
import com.example.demo.entity.Module;
import com.example.demo.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ModuleTaskService {

    private static final Logger log = LoggerFactory.getLogger(ModuleTaskService.class);

    private final ModuleTaskRepository moduleTaskRepository;
    private final ModuleTaskTestCaseRepository testCaseRepository;
    private final ModuleTaskSubmissionRepository submissionRepository;
    private final ModuleRepository moduleRepository;
    private final StudentRepository studentRepository;
    private final CodeExecutionService codeExecutionService;
    private final ProgressRepository progressRepository;

    public ModuleTaskService(ModuleTaskRepository moduleTaskRepository,
                             ModuleTaskTestCaseRepository testCaseRepository,
                             ModuleTaskSubmissionRepository submissionRepository,
                             ModuleRepository moduleRepository,
                             StudentRepository studentRepository,
                             CodeExecutionService codeExecutionService,
                             ProgressRepository progressRepository) {
        this.moduleTaskRepository = moduleTaskRepository;
        this.testCaseRepository = testCaseRepository;
        this.submissionRepository = submissionRepository;
        this.moduleRepository = moduleRepository;
        this.studentRepository = studentRepository;
        this.codeExecutionService = codeExecutionService;
        this.progressRepository = progressRepository;
    }

    @Transactional
    public ModuleTask createTask(Long moduleId, String title, String description, String language, Integer maxScore, String difficulty, List<ModuleTaskTestCase> testCases) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found"));

        ModuleTask task = new ModuleTask();
        task.setModule(module);
        task.setTitle(title);
        task.setDescription(description);
        task.setLanguage(language);
        task.setMaxScore(maxScore);
        task.setDifficulty(difficulty);
        
        ModuleTask savedTask = moduleTaskRepository.save(task);

        if (testCases != null) {
            for (ModuleTaskTestCase tc : testCases) {
                tc.setModuleTask(savedTask);
                testCaseRepository.save(tc);
            }
        }
        log.info("Created module task id={} moduleId={} title={}", savedTask.getId(), moduleId, savedTask.getTitle());
        return savedTask;
    }

    public List<ModuleTask> getTasksByModule(Long moduleId) {
        List<ModuleTask> tasks = moduleTaskRepository.findByModuleIdOrderByIdAsc(moduleId);
        log.debug("Fetched {} tasks for moduleId={}", tasks.size(), moduleId);
        return tasks;
    }

    public ModuleTask getTaskById(Long taskId) {
        return moduleTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
    }

    @Transactional
    public ModuleTask updateTask(Long taskId, String title, String description, String language, Integer maxScore, String difficulty, List<ModuleTaskTestCase> testCases) {
        ModuleTask task = moduleTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setTitle(title);
        task.setDescription(description);
        task.setLanguage(language);
        task.setMaxScore(maxScore);
        task.setDifficulty(difficulty);

        List<ModuleTaskTestCase> existingCases = testCaseRepository.findByModuleTaskId(taskId);
        if (!existingCases.isEmpty()) {
            testCaseRepository.deleteAll(existingCases);
            testCaseRepository.flush();
        }

        List<ModuleTaskTestCase> nextCases = testCases == null ? List.of() : testCases;
        for (ModuleTaskTestCase tc : nextCases) {
            tc.setId(null);
            tc.setModuleTask(task);
            testCaseRepository.save(tc);
        }

        ModuleTask savedTask = moduleTaskRepository.save(task);
        log.info("Updated module task id={} title={}", savedTask.getId(), savedTask.getTitle());
        return savedTask;
    }

    @Transactional
    public void deleteTask(Long taskId) {
        ModuleTask task = moduleTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        moduleTaskRepository.delete(task);
        log.info("Deleted module task id={}", taskId);
    }

    public long getSubmissionCount(Long taskId) {
        return submissionRepository.countByModuleTaskId(taskId);
    }

    public ModuleTaskSubmission submitCode(Long studentId, Long taskId, String code) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        ModuleTask task = moduleTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Anti-spam 2-second cooldown
        java.util.Optional<ModuleTaskSubmission> lastSub = submissionRepository.findTopByStudentIdAndModuleTaskIdOrderBySubmittedAtDesc(studentId, taskId);
        if (lastSub.isPresent()) {
            long secondsSinceLast = java.time.Duration.between(lastSub.get().getSubmittedAt(), java.time.LocalDateTime.now()).getSeconds();
            if (secondsSinceLast < 2) {
                throw new RuntimeException("Please wait 2 seconds before submitting again.");
            }
        }

        String codeHash = getCodeHash(code);

        List<ModuleTaskTestCase> testCases = testCaseRepository.findByModuleTaskId(taskId);
        
        int passedCount = 0;
        StringBuilder feedback = new StringBuilder();
        long totalExecutionTime = 0;
        boolean hasCompilationError = false;
        boolean hasSecurityViolation = false;
        
        for (int i = 0; i < testCases.size(); i++) {
            ModuleTaskTestCase tc = testCases.get(i);
            com.example.demo.service.execution.ExecutionResult result = codeExecutionService.executeCode(task.getLanguage(), code, tc.getInput());
            
            totalExecutionTime += result.executionTimeMs();

            if (result.isSecurityViolation()) {
                feedback.append("Security Violation: Your code contains restricted classes or functions.\n");
                hasSecurityViolation = true;
                break;
            }

            if (!result.success()) {
                hasCompilationError = true;
                feedback.append("Test Case ").append(i + 1).append(" Failed: ").append(result.error()).append("\n");
                continue;
            }
            
            String actualOutput = result.output().trim();
            String expectedOutput = tc.getExpectedOutput().trim();
            
            if (actualOutput.equals(expectedOutput)) {
                passedCount++;
            } else {
                if (tc.isHidden()) {
                    feedback.append("Hidden Test Case Failed.\n");
                } else {
                    feedback.append("Test Case ").append(i + 1).append(" Failed.\nExpected: ").append(expectedOutput).append("\nGot: ").append(actualOutput).append("\n");
                }
            }
        }
        
        int score = testCases.isEmpty() ? task.getMaxScore() : (int) Math.round((double) passedCount / testCases.size() * task.getMaxScore());
        String status = passedCount == testCases.size() && !testCases.isEmpty() ? "PASS" : "FAIL";
        if (hasSecurityViolation || hasCompilationError) {
            status = "ERROR";
            score = 0;
        }
        if (testCases.isEmpty() && !hasSecurityViolation && !hasCompilationError) {
            status = "PASS";
            feedback.append("No test cases provided. Automatically passed.");
        } else if (!hasSecurityViolation && !hasCompilationError) {
            feedback.insert(0, passedCount + "/" + testCases.size() + " test cases passed.\n\n");
        }

        ModuleTaskSubmission submission = new ModuleTaskSubmission();
        submission.setStudent(student);
        submission.setModuleTask(task);
        submission.setCode(code);
        submission.setScore(score);
        submission.setStatus(status);
        submission.setFeedback(feedback.toString());
        submission.setCodeHash(codeHash);
        submission.setExecutionTimeMs(totalExecutionTime);
        
        return submissionRepository.save(submission);
    }

    private String getCodeHash(String code) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(code.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception ex) {
            return "N/A";
        }
    }

    public List<ModuleTaskSubmission> getSubmissionsByStudent(Long studentId) {
        return submissionRepository.findByStudentId(studentId);
    }

    public List<ModuleTask> getAllTasks() {
        return moduleTaskRepository.findAll();
    }

    public List<ModuleTaskSubmission> getSubmissionsByTaskId(Long taskId) {
        return submissionRepository.findByModuleTaskId(taskId);
    }

    public boolean isModuleCompleted(Long studentId, Long moduleId) {
        long totalLessons = progressRepository.countTotalLessonsByModuleId(moduleId);
        long completedLessons = progressRepository.countCompletedLessonsByStudentAndModule(studentId, moduleId);

        if (completedLessons < totalLessons) {
            return false;
        }

        List<ModuleTask> tasks = moduleTaskRepository.findByModuleIdOrderByIdAsc(moduleId);
        if (tasks.isEmpty()) {
            return true; // No tasks, but all lessons are completed
        }

        List<ModuleTaskSubmission> submissions = submissionRepository.findByStudentId(studentId);
        for (ModuleTask task : tasks) {
            boolean passed = submissions.stream()
                    .anyMatch(sub -> sub.getModuleTask().getId().equals(task.getId()) && "PASS".equals(sub.getStatus()));
            if (!passed) {
                return false;
            }
        }
        return true;
    }

    public com.example.demo.dto.CourseResultDTO calculateCourseResult(Long studentId, Long courseId) {
        com.example.demo.dto.CourseResultDTO result = new com.example.demo.dto.CourseResultDTO();

        // 1. Get all tasks for the course
        List<ModuleTask> allTasks = moduleTaskRepository.findByModule_Course_Id(courseId);
        result.setTotalTasksCount((long) allTasks.size());

        int totalScore = 0;
        int obtainedScore = 0;
        long passedTasksCount = 0;

        List<ModuleTaskSubmission> submissions = submissionRepository.findByStudentId(studentId);

        for (ModuleTask task : allTasks) {
            totalScore += task.getMaxScore();

            // Find highest passing submission for this task
            int highestScore = submissions.stream()
                    .filter(sub -> sub.getModuleTask().getId().equals(task.getId()) && "PASS".equals(sub.getStatus()))
                    .mapToInt(ModuleTaskSubmission::getScore)
                    .max()
                    .orElse(0);

            if (highestScore > 0 || task.getMaxScore() == 0) { // If maxScore is 0, passing might mean 0 score
                boolean isPassed = submissions.stream()
                    .anyMatch(sub -> sub.getModuleTask().getId().equals(task.getId()) && "PASS".equals(sub.getStatus()));
                if (isPassed) {
                    passedTasksCount++;
                    obtainedScore += highestScore;
                }
            }
        }

        result.setTotalScore(totalScore);
        result.setObtainedScore(obtainedScore);
        result.setCompletedTasksCount(passedTasksCount);
        
        double percentage = totalScore > 0 ? ((double) obtainedScore / totalScore) * 100 : 0.0;
        result.setPercentage(Math.round(percentage * 100.0) / 100.0);

        // 2. Check modules completion
        List<Module> modules = moduleRepository.findByCourseId(courseId);
        result.setTotalModulesCount((long) modules.size());
        
        long completedModulesCount = 0;
        for (Module m : modules) {
            if (isModuleCompleted(studentId, m.getId())) {
                completedModulesCount++;
            }
        }
        result.setCompletedModulesCount(completedModulesCount);

        // 3. Determine Final Status
        if (completedModulesCount == modules.size() && result.getPercentage() >= 40.0) {
            result.setStatus("PASS");
        } else {
            result.setStatus("FAIL");
        }

        return result;
    }
}
