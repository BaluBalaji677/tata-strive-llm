package com.example.demo.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.service.AuthService;

import lombok.extern.slf4j.Slf4j;

/**
 * Admin Authentication Controller
 * Handles admin-specific authentication flows:
 * - Password change after forced password change flag (mustChangePassword=true)
 * - Regular password changes
 */
@Slf4j
@RestController
@RequestMapping("/admin")
public class AdminAuthController {

    private final AuthService authService;

    public AdminAuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Admin changes password after being forced to due to:
     * - Password reset by PRINCIPAL
     * - First-time login setup
     *
     * Requires:
     * - Authentication (JWT token from admin login)
     * - Current password (for verification)
     * - New password
     *
     * Response: Message confirming password change
     */
    @PostMapping("/change-password")
    public ChangePasswordResponse changePassword(
            Authentication authentication,
            @RequestBody ChangePasswordRequest request
    ) {
        log.info("[ADMIN] Change password requested by: {}", authentication.getName());

        String adminUsername = authentication.getName();
        var authResponse = authService.changeAdminPassword(
                adminUsername,
                request.currentPassword(),
                request.newPassword()
        );

        log.info("[ADMIN] Password changed successfully for: {}", adminUsername);
        return new ChangePasswordResponse(authResponse.message());
    }

    /**
     * Request DTO for password change
     */
    public record ChangePasswordRequest(String currentPassword, String newPassword) {}

    /**
     * Response DTO for password change
     */
    public record ChangePasswordResponse(String message) {}
}
