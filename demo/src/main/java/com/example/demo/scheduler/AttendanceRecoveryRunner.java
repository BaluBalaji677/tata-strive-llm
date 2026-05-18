package com.example.demo.scheduler;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.example.demo.entity.Student;
import com.example.demo.repository.StudentRepository;
import com.example.demo.service.AttendanceReportService;
import com.example.demo.service.AttendanceService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class AttendanceRecoveryRunner {

    private final AttendanceService attendanceService;
    private final AttendanceReportService attendanceReportService;
    private final StudentRepository studentRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void runRecoveryOnStartup() {
        log.info("=== [RECOVERY] Checking for missed attendance jobs on startup ===");

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        LocalTime now = LocalTime.now(ZoneId.of("Asia/Kolkata"));
        LocalTime cutoff = LocalTime.of(15, 0);

        // Prevent recovery from marking absent before the scheduled 3:00 PM cutoff.
        if (now.isBefore(cutoff)) {
            log.info("=== [RECOVERY] Current time {} IST is before cutoff {} IST, skipping startup recovery ===", now, cutoff);
            return;
        }

        // Check if attendance has already been marked for today
        if (attendanceService.isTodayAttendanceMarked()) {
            log.info("=== [RECOVERY] Attendance already exists for today ({}) , skipping recovery ===", today);
            return;
        }

        log.warn("=== [RECOVERY] Missed attendance job detected for {}. Running recovery... ===", today);

        try {
            // Fetch all students
            List<Student> students = studentRepository.findAll();

            // Mark absent for students who haven't been marked
            for (Student student : students) {
                attendanceService.markAbsentIfNotMarkedToday(student);
            }

            log.info("=== [RECOVERY] Attendance marking completed, now generating report ===");

            // Generate the daily report
            attendanceReportService.generateDailyReport();

            log.info("=== [RECOVERY] Recovery completed successfully for {} ===", today);

        } catch (Exception e) {
            log.error("=== [RECOVERY] Error during recovery process ===", e);
            throw new RuntimeException("Failed to complete attendance recovery", e);
        }
    }
}