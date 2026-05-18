package com.example.demo.service.execution;

public interface LanguageExecutor {
    ExecutionResult execute(String code, String input);
    boolean isSecure(String code);
}
