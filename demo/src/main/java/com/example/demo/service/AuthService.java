package com.example.demo.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
                    return new RuntimeException("User not found");
                });

        System.out.println("✅ USER FOUND: " + user.getUsername());

        if (!encoder.matches(password, user.getPasswordHash())) {
            System.out.println("❌ PASSWORD WRONG");
            throw new RuntimeException("Invalid password");
        }

        System.out.println("✅ PASSWORD CORRECT");

        String accessToken = jwtUtil.generateAccessToken(user.getUsername());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUsername());

        System.out.println("✅ TOKENS GENERATED");
        System.out.println("===== ADMIN LOGIN END =====");

        return new LoginResponse(accessToken, refreshToken, "ADMIN", user.getUsername(), false);
    }

    public LoginResponse studentLogin(String rollNumber, String password) {

        System.out.println("===== STUDENT LOGIN START =====");
        System.out.println("ROLL NUMBER: " + rollNumber);

        Student student = studentRepo.findByRollNumber(rollNumber)
                .orElseThrow(() -> {
                    System.out.println("❌ STUDENT NOT FOUND");
                    return new RuntimeException("Student not found");
                });

        System.out.println("✅ STUDENT FOUND");

        User user = student.getUser();

        if (!encoder.matches(password, user.getPasswordHash())) {
            System.out.println("❌ PASSWORD WRONG");
            throw new RuntimeException("Invalid password");
        }

        System.out.println("✅ PASSWORD CORRECT");

        String accessToken = jwtUtil.generateAccessToken(student.getRollNumber());
        String refreshToken = jwtUtil.generateRefreshToken(student.getRollNumber());
        boolean mustChangePassword = Boolean.TRUE.equals(user.getMustChangePassword());

        System.out.println("✅ TOKENS GENERATED");
        System.out.println("===== STUDENT LOGIN END =====");

        return new LoginResponse(accessToken, refreshToken, "STUDENT", student.getRollNumber(), mustChangePassword);
    }

    public LoginResponse refreshTokens(String refreshToken) {
        String username = jwtUtil.extractUsername(refreshToken);
        if (username == null || !jwtUtil.validateRefreshToken(refreshToken, username)) {
            throw new RuntimeException("Invalid or expired refresh token");
        }

        String newAccessToken = jwtUtil.generateAccessToken(username);
        return new LoginResponse(newAccessToken, refreshToken, null, username, false);
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

    public record LoginResponse(String accessToken, String refreshToken, String role, String username, boolean mustChangePassword) {}
}