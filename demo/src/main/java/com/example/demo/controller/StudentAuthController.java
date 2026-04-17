package com.example.demo.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.service.AuthService;

@RestController
@RequestMapping("/student")
public class StudentAuthController {

    private final AuthService authService;

    public StudentAuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/change-password")
    public ChangePasswordResponse changePassword(
            Authentication authentication,
            @RequestBody ChangePasswordRequest request
    ) {
        String rollNumber = authentication.getName();
        return authService.changeStudentPassword(
                rollNumber,
                request.currentPassword(),
                request.newPassword()
        );
    }

    public record ChangePasswordRequest(String currentPassword, String newPassword) {}

    public record ChangePasswordResponse(String message) {}
}
