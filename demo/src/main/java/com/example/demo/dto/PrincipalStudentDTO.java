package com.example.demo.dto;

public record PrincipalStudentDTO(
        Long id,
        String rollNumber,
        String fullName,
        String email,
        String status
) {
}
