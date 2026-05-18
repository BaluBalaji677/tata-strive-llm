package com.example.demo.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.service.AuthService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/admin/login")
    public ResponseEntity<?> adminLogin(@RequestBody Map<String, String> req) {
        try {
            return ResponseEntity.ok(authService.adminLogin(req.get("username"), req.get("password")));
        } catch (IllegalArgumentException ex) {
            log.warn("Admin/principal login rejected: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ex.getMessage()));
        } catch (IllegalStateException ex) {
            log.error("Admin/principal login crashed", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/student/login")
    public ResponseEntity<?> studentLogin(@RequestBody Map<String, String> req) {
        try {
            return ResponseEntity.ok(authService.studentLogin(req.get("rollNumber"), req.get("password")));
        } catch (IllegalArgumentException ex) {
            log.warn("Student login rejected: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ex.getMessage()));
        } catch (IllegalStateException ex) {
            log.error("Student login crashed", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponse> refresh(@RequestBody RefreshRequest request) {
        try {
            AuthService.LoginResponse loginResponse = authService.refreshTokens(request.refreshToken());
            return ResponseEntity.ok(new RefreshResponse(loginResponse.accessToken()));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token", ex);
        }
    }

    public record RefreshRequest(String refreshToken) {}
    public record RefreshResponse(String accessToken) {}
}
