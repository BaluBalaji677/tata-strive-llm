package com.example.demo.dto;

public record PrincipalTeacherDTO(
        Long id,
        String username,
        String email,
        String fullName,
        String role,
        Boolean mustChangePassword
) {
}
