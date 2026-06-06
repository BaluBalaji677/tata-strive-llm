package com.example.demo.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.entity.Student;
import com.example.demo.entity.User;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;

@Service
public class AuthService {

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

        System.out.println("===== ADMIN LOGIN START =====");
        System.out.println("USERNAME: " + username);

        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> {
                    System.out.println("❌ USER NOT FOUND");
                    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found");
                });

        System.out.println("✅ USER FOUND: " + user.getUsername());

        if (!encoder.matches(password, user.getPasswordHash())) {
            System.out.println("❌ PASSWORD WRONG");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid password");
        }

        System.out.println("✅ PASSWORD CORRECT");

        String accessToken = jwtUtil.generateAccessToken(user.getUsername());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUsername());
        boolean mustChangePassword = Boolean.TRUE.equals(user.getMustChangePassword());

        System.out.println("✅ TOKENS GENERATED");
        System.out.println("===== ADMIN LOGIN END =====");

        return new LoginResponse(accessToken, refreshToken, "ADMIN", user.getUsername(), mustChangePassword);
    }

    public LoginResponse studentLogin(String rollNumber, String password) {

        System.out.println("===== STUDENT LOGIN START =====");
        System.out.println("ROLL NUMBER: " + rollNumber);

        Student student = studentRepo.findByRollNumber(rollNumber)
                .orElseThrow(() -> {
                    System.out.println("❌ STUDENT NOT FOUND");
                    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student not found");
                });

        System.out.println("✅ STUDENT FOUND");

        User user = student.getUser();

        if (!encoder.matches(password, user.getPasswordHash())) {
            System.out.println("❌ PASSWORD WRONG");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid password");
        }

        System.out.println("✅ PASSWORD CORRECT");

        String accessToken = jwtUtil.generateAccessToken(student.getRollNumber());
        String refreshToken = jwtUtil.generateRefreshToken(student.getRollNumber());
        boolean mustChangePassword = Boolean.TRUE.equals(user.getMustChangePassword());

        System.out.println("✅ TOKENS GENERATED");
        System.out.println("===== STUDENT LOGIN END =====");

        return new LoginResponse(accessToken, refreshToken, "STUDENT", student.getRollNumber(), mustChangePassword);
    }

    public LoginResponse unifiedLogin(String identifier, String password) {
        System.out.println("===== UNIFIED LOGIN START =====");
        System.out.println("IDENTIFIER: " + identifier);

        // Try username-based login first (admin/teacher/principal)
        var userOpt = userRepo.findByUsername(identifier);
        if (userOpt.isPresent()) {
            System.out.println("✅ USER FOUND BY USERNAME");
            User user = userOpt.get();
            if (!encoder.matches(password, user.getPasswordHash())) {
                System.out.println("❌ PASSWORD WRONG");
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid password");
            }
            System.out.println("✅ PASSWORD CORRECT");
            String accessToken = jwtUtil.generateAccessToken(user.getUsername());
            String refreshToken = jwtUtil.generateRefreshToken(user.getUsername());
            String role = user.getRole() != null ? user.getRole().name() : "ADMIN";
            boolean mustChangePassword = Boolean.TRUE.equals(user.getMustChangePassword());
            System.out.println("✅ TOKENS GENERATED - Role: " + role);
            System.out.println("===== UNIFIED LOGIN END =====");
            return new LoginResponse(accessToken, refreshToken, role, user.getUsername(), mustChangePassword);
        }

        // Try roll number-based login (student)
        var studentOpt = studentRepo.findByRollNumber(identifier);
        if (studentOpt.isPresent()) {
            System.out.println("✅ STUDENT FOUND BY ROLL NUMBER");
            Student student = studentOpt.get();
            User user = student.getUser();
            if (!encoder.matches(password, user.getPasswordHash())) {
                System.out.println("❌ PASSWORD WRONG");
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid password");
            }
            System.out.println("✅ PASSWORD CORRECT");
            String accessToken = jwtUtil.generateAccessToken(student.getRollNumber());
            String refreshToken = jwtUtil.generateRefreshToken(student.getRollNumber());
            boolean mustChangePassword = Boolean.TRUE.equals(user.getMustChangePassword());
            System.out.println("✅ TOKENS GENERATED - Role: STUDENT");
            System.out.println("===== UNIFIED LOGIN END =====");
            return new LoginResponse(accessToken, refreshToken, "STUDENT", student.getRollNumber(), mustChangePassword);
        }

        System.out.println("❌ NO USER FOUND");
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid credentials");
    }

    public LoginResponse refreshTokens(String refreshToken) {
        String username = jwtUtil.extractUsername(refreshToken);
        if (username == null || !jwtUtil.validateRefreshToken(refreshToken, username)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired refresh token");
        }

        String newAccessToken = jwtUtil.generateAccessToken(username);
        return new LoginResponse(newAccessToken, refreshToken, null, username, false);
    }

    public com.example.demo.controller.StudentAuthController.ChangePasswordResponse changeStudentPassword(
            String identifier,
            String currentPassword,
            String newPassword
    ) {
        Student student = studentRepo.findByRollNumber(identifier)
                .or(() -> studentRepo.findByUser_Username(identifier))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student not found"));

        User user = student.getUser();
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not linked to student");
        }

        if (!encoder.matches(currentPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        user.setPasswordHash(encoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepo.save(user);

        return new com.example.demo.controller.StudentAuthController.ChangePasswordResponse("Password changed successfully");
    }

    // ===================== ADMIN PASSWORD RECOVERY =====================

    /**
     * Reset admin password by admin ID (called by PRINCIPAL only).
     * Sets mustChangePassword=true to force password change on next login.
     *
     * @param adminId ID of the admin user
     * @param newPassword temporary password to set
     * @return response with updated admin info
     */
    public ChangePasswordResponse resetAdminPassword(Long adminId, String newPassword) {
        User admin = userRepo.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

        // Verify target is ADMIN role
        com.example.demo.entity.Role role = admin.getRole();
        if (role != com.example.demo.entity.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Target user is not an admin. Current role: " + (role != null ? role.name() : "UNKNOWN"));
        }

        // Encode and set new password
        admin.setPasswordHash(encoder.encode(newPassword));
        admin.setMustChangePassword(true);

        User savedAdmin = userRepo.save(admin);
        System.out.println("✅ [ADMIN RECOVERY] Password reset for admin: " + savedAdmin.getUsername());

        return new ChangePasswordResponse("Admin password reset successfully. Admin must change password on next login.");
    }

    /**
     * Admin changes their password after forced password change or self-initiated change.
     * This is called after mustChangePassword=true redirects to change password page.
     *
     * @param adminUsername username of the admin
     * @param currentPassword current password
     * @param newPassword new password
     * @return response confirming password change
     */
    public ChangePasswordResponse changeAdminPassword(
            String adminUsername,
            String currentPassword,
            String newPassword
    ) {
        User admin = userRepo.findByUsername(adminUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin not found"));

        // Verify current password
        if (!encoder.matches(currentPassword, admin.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        // Update password and clear forced change flag
        admin.setPasswordHash(encoder.encode(newPassword));
        admin.setMustChangePassword(false);
        userRepo.save(admin);

        System.out.println("✅ [ADMIN] Password changed successfully for admin: " + adminUsername);

        return new ChangePasswordResponse("Password changed successfully");
    }

    public record LoginResponse(String accessToken, String refreshToken, String role, String username, boolean mustChangePassword) {}

    public record ChangePasswordResponse(String message) {}
}