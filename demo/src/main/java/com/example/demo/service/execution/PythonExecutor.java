package com.example.demo.service.execution;

import org.springframework.stereotype.Component;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@Component("pythonExecutor")
public class PythonExecutor implements LanguageExecutor {

    private static final Pattern[] BLOCKED_PATTERNS = {
        Pattern.compile("import\\s+os"),
        Pattern.compile("import\\s+subprocess"),
        Pattern.compile("import\\s+sys"),
        Pattern.compile("__import__\\s*\\("),
        Pattern.compile("eval\\s*\\("),
        Pattern.compile("exec\\s*\\(")
    };

    @Override
    public boolean isSecure(String code) {
        for (Pattern pattern : BLOCKED_PATTERNS) {
            if (pattern.matcher(code).find()) {
                return false;
            }
        }
        return true;
    }

    @Override
    public ExecutionResult execute(String code, String input) {
        if (!isSecure(code)) {
            return ExecutionResult.securityViolation("Security Violation: Use of restricted modules or functions.");
        }

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("python_exec_");
            File scriptFile = new File(tempDir.toFile(), "script.py");
            Files.writeString(scriptFile.toPath(), code);

            ProcessBuilder pb = new ProcessBuilder("python", scriptFile.getAbsolutePath());
            return runProcess(pb, input, 5);
        } catch (Exception e) {
            return new ExecutionResult(false, "", "Execution error: " + e.getMessage(), 0L, false);
        } finally {
            cleanup(tempDir);
        }
    }

    private ExecutionResult runProcess(ProcessBuilder pb, String input, int timeoutSeconds) throws IOException, InterruptedException {
        long startTime = System.currentTimeMillis();
        Process process = pb.start();

        if (input != null && !input.isEmpty()) {
            try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()))) {
                writer.write(input);
                writer.flush();
            }
        }

        boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
        long executionTimeMs = System.currentTimeMillis() - startTime;

        if (!finished) {
            process.destroyForcibly();
            return new ExecutionResult(false, "", "Execution Timeout (" + timeoutSeconds + "s)", executionTimeMs, false);
        }

        String output = readStream(process.getInputStream());
        String error = readStream(process.getErrorStream());

        return new ExecutionResult(process.exitValue() == 0, output, error, executionTimeMs, false);
    }

    private String readStream(InputStream is) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
        }
        return sb.toString();
    }

    private void cleanup(Path dir) {
        if (dir != null) {
            File[] files = dir.toFile().listFiles();
            if (files != null) {
                for (File f : files) {
                    f.delete();
                }
            }
            dir.toFile().delete();
        }
    }
}
