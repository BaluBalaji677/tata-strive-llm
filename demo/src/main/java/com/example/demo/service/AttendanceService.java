package com.example.demo.service;

import java.util.List;

import com.example.demo.entity.Attendance;

public interface AttendanceService {

    // Admin
    Attendance markTodayAttendance(String rollNumber, boolean present);
    List<Attendance> getAllAttendance(String rollNumber);

    // Student
    List<Attendance> getMyAttendance();

    AttendanceSummary getMyAttendanceSummary();

    record AttendanceSummary(double percentage, String status) {}
}

