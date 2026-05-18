package com.example.demo.service;

import com.example.demo.service.execution.ExecutionResult;
import com.example.demo.service.execution.LanguageExecutor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class CodeExecutionService {

    private final LanguageExecutor javaExecutor;
    private final LanguageExecutor pythonExecutor;

    @Autowired
    public CodeExecutionService(
            @Qualifier("javaExecutor") LanguageExecutor javaExecutor,
            @Qualifier("pythonExecutor") LanguageExecutor pythonExecutor) {
        this.javaExecutor = javaExecutor;
        this.pythonExecutor = pythonExecutor;
    }

    public ExecutionResult executeCode(String language, String code, String input) {
        if ("java".equalsIgnoreCase(language)) {
            return javaExecutor.execute(code, input);
        } else if ("python".equalsIgnoreCase(language)) {
            return pythonExecutor.execute(code, input);
        }
        return new ExecutionResult(false, "", "Unsupported language: " + language, 0L, false);
    }
}
