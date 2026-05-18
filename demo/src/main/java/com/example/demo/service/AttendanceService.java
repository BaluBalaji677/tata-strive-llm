package com.example.demo.service;

import java.util.List;

import com.example.demo.entity.Attendance;
import com.example.demo.entity.Student;

public interface AttendanceService {

    // Admin
    Attendance markTodayAttendance(String rollNumber, boolean present);
    List<Attendance> getAllAttendance(String rollNumber);

    // Student
    List<Attendance> getMyAttendance();

    AttendanceSummary getMyAttendanceSummary();

    // Scheduler / Recovery
    void markAbsentIfNotMarkedToday(Student student);
    boolean isTodayAttendanceMarked();
    void finalizeTodayAttendanceIfNeeded();

    record AttendanceSummary(double percentage, String status) {}
}

