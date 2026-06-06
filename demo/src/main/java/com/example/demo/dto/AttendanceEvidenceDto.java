package com.example.demo.dto;

public record AttendanceEvidenceDto(
        Long id,
        String imageUrl,
        String publicId,
        String capturedAt,
        String expiresAt,
        String attendanceSessionId
) {
}
