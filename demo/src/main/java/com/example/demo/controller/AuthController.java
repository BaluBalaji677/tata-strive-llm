package com.example.demo.controller;

import java.util.Map;

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

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/admin/login")
    public AuthService.LoginResponse adminLogin(@RequestBody Map<String, String> req) {
        return authService.adminLogin(req.get("username"), req.get("password"));
    }

    @PostMapping("/student/login")
    public AuthService.LoginResponse studentLogin(@RequestBody Map<String, String> req) {
        return authService.studentLogin(req.get("rollNumber"), req.get("password"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponse> refresh(@RequestBody RefreshRequest request) {
        try {
            AuthService.LoginResponse loginResponse = authService.refreshTokens(request.refreshToken());
            return ResponseEntity.ok(new RefreshResponse(loginResponse.accessToken()));
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token", ex);
        }
    }

    public record RefreshRequest(String refreshToken) {}
    public record RefreshResponse(String accessToken) {}
}