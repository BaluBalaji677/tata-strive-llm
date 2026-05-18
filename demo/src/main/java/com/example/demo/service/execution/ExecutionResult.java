package com.example.demo.service.execution;

public record ExecutionResult(boolean success, String output, String error, Long executionTimeMs, boolean isSecurityViolation) {
    public static ExecutionResult securityViolation(String message) {
        return new ExecutionResult(false, "", message, 0L, true);
    }
}
