package com.example.demo.dto;

public record PrincipalAnalyticsDTO(
        long totalStudents,
        long totalAdmins,
        long totalPrincipals,
        long totalCourses,
        long totalAttendanceMarkings
) {
}
