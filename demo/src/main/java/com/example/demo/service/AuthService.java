package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.entity.Role;
import com.example.demo.entity.Student;
import com.example.demo.entity.User;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepo;
    private final StudentRepository studentRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepo,
                       StudentRepository studentRepo,
                       PasswordEncoder encoder,
                       JwtUtil jwtUtil) {
        this.userRepo = userRepo;
        this.studentRepo = studentRepo;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
    }

    public LoginResponse adminLogin(String username, String password) {
        log.info("Admin/principal login requested for username={}", username);
        validateCredentials(username, password);

        try {
            User user = userRepo.findByUsername(username)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

            String role = requireRole(user);
            if (Role.STUDENT.name().equals(role)) {
                throw new IllegalArgumentException("Use the student login endpoint for student accounts");
            }

            if (!hasPassword(user) || !encoder.matches(password, user.getPasswordHash())) {
                throw new IllegalArgumentException("Invalid username or password");
            }

            String accessToken = jwtUtil.generateAccessToken(user.getUsername(), role);
            String refreshToken = jwtUtil.generateRefreshToken(user.getUsername(), role);

            log.info("Admin/principal login succeeded for username={} role={}", user.getUsername(), role);
            return new LoginResponse(accessToken, refreshToken, role, user.getUsername(), false);
        } catch (IllegalArgumentException ex) {
            log.warn("Admin/principal login failed for username={}: {}", username, ex.getMessage());
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error during admin/principal login for username={}", username, ex);
            throw new IllegalStateException("Authentication failed due to a server error", ex);
        }
    }

    public LoginResponse studentLogin(String rollNumber, String password) {
        log.info("Student login requested for rollNumber={}", rollNumber);
        validateCredentials(rollNumber, password);

        try {
            Student student = studentRepo.findByRollNumber(rollNumber)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid roll number or password"));

            User user = student.getUser();
            if (user == null) {
                throw new IllegalStateException("Student is not linked to a user account");
            }

            String role = requireRole(user);
            if (!Role.STUDENT.name().equals(role)) {
                throw new IllegalStateException("Student account has invalid role: " + role);
            }

            if (!hasPassword(user) || !encoder.matches(password, user.getPasswordHash())) {
                throw new IllegalArgumentException("Invalid roll number or password");
            }

            String accessToken = jwtUtil.generateAccessToken(student.getRollNumber(), role);
            String refreshToken = jwtUtil.generateRefreshToken(student.getRollNumber(), role);
            boolean mustChangePassword = Boolean.TRUE.equals(user.getMustChangePassword());

            log.info("Student login succeeded for rollNumber={}", student.getRollNumber());
            return new LoginResponse(accessToken, refreshToken, role, student.getRollNumber(), mustChangePassword);
        } catch (IllegalArgumentException ex) {
            log.warn("Student login failed for rollNumber={}: {}", rollNumber, ex.getMessage());
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error during student login for rollNumber={}", rollNumber, ex);
            throw new IllegalStateException("Authentication failed due to a server error", ex);
        }
    }

    public LoginResponse refreshTokens(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("Refresh token is required");
        }

        String username = jwtUtil.extractUsername(refreshToken);
        if (username == null || !jwtUtil.validateRefreshToken(refreshToken, username)) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        String role = resolveRoleForRefresh(username, jwtUtil.extractRole(refreshToken));
        String newAccessToken = jwtUtil.generateAccessToken(username, role);
        return new LoginResponse(newAccessToken, refreshToken, role, username, false);
    }

    public com.example.demo.controller.StudentAuthController.ChangePasswordResponse changeStudentPassword(
            String rollNumber,
            String currentPassword,
            String newPassword
    ) {
        Student student = studentRepo.findByRollNumber(rollNumber)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        User user = student.getUser();
        if (user == null) {
            throw new RuntimeException("User not linked to student");
        }

        if (!encoder.matches(currentPassword, user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPasswordHash(encoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepo.save(user);

        return new com.example.demo.controller.StudentAuthController.ChangePasswordResponse("Password changed successfully");
    }

    private void validateCredentials(String identity, String password) {
        if (identity == null || identity.isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
    }

    private boolean hasPassword(User user) {
        return user.getPasswordHash() != null && !user.getPasswordHash().isBlank();
    }

    private String requireRole(User user) {
        if (user == null || user.getRole() == null) {
            throw new IllegalStateException("User role is missing");
        }
        return user.getRole().name();
    }

    private String resolveRoleForRefresh(String username, String roleFromToken) {
        if (roleFromToken != null && !roleFromToken.isBlank()) {
            return roleFromToken;
        }

        return studentRepo.findByRollNumber(username)
                .map(Student::getUser)
                .map(this::requireRole)
                .orElseGet(() -> userRepo.findByUsername(username)
                        .map(this::requireRole)
                        .orElseThrow(() -> new IllegalArgumentException("Unable to resolve user role")));
    }

    public record LoginResponse(String accessToken, String refreshToken, String role, String username, boolean mustChangePassword) {}
}
