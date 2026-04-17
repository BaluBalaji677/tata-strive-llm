package com.example.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.entity.Attendance;
import com.example.demo.service.AttendanceService;

@RestController
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    // =======================
    // ADMIN
    // =======================
    // Marks attendance for "today" using rollNumber.
    @PostMapping("/admin/attendance")
    public ResponseEntity<AttendanceResponse> markAttendance(
            @RequestParam String rollNumber,
            @RequestParam boolean present
    ) {
        Attendance a = attendanceService.markTodayAttendance(rollNumber, present);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(a));
    }

    @GetMapping("/admin/attendance")
    public ResponseEntity<List<AttendanceResponse>> getAllAttendance(
            @RequestParam(required = false) String rollNumber
    ) {
        List<Attendance> list = attendanceService.getAllAttendance(rollNumber);
        return ResponseEntity.ok(list.stream().map(this::toResponse).toList());
    }

    // =======================
    // STUDENT
    // =======================
    @GetMapping("/student/attendance")
    public ResponseEntity<List<AttendanceResponse>> myAttendance() {
        List<Attendance> list = attendanceService.getMyAttendance();
        return ResponseEntity.ok(list.stream().map(this::toResponse).toList());
    }

    @GetMapping("/student/attendance-summary")
    public ResponseEntity<AttendanceService.AttendanceSummary> mySummary() {
        return ResponseEntity.ok(attendanceService.getMyAttendanceSummary());
    }

    private AttendanceResponse toResponse(Attendance a) {
        String roll = a.getStudent() != null ? a.getStudent().getRollNumber() : "Unknown";
        String name = a.getStudent() != null ? a.getStudent().getFullName() : "Unknown";
        return new AttendanceResponse(a.getId(), a.getDate().toString(), a.isPresent(), roll, name);
    }

    public record AttendanceResponse(Long id, String date, boolean present, String rollNumber, String studentName) {}
}

