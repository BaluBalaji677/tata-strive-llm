package com.example.demo.scheduler;

import java.util.List;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.demo.entity.Student;
import com.example.demo.repository.StudentRepository;
import com.example.demo.service.AttendanceReportService;
import com.example.demo.service.AttendanceService;

@Component
@Slf4j
public class AttendanceScheduler {

    private final AttendanceService attendanceService;
    private final StudentRepository studentRepository;
    private final AttendanceReportService attendanceReportService;

    public AttendanceScheduler(AttendanceService attendanceService, StudentRepository studentRepository, AttendanceReportService attendanceReportService) {
        this.attendanceService = attendanceService;
        this.studentRepository = studentRepository;
        this.attendanceReportService = attendanceReportService;
    }

    /**
     * Scheduled task to finalize attendance at 3:00 PM IST daily.
     * Marks unmarked students as absent and generates daily report.
     */
    @Scheduled(cron = "0 0 15 * * ?", zone = "Asia/Kolkata")
    public void finalizeDailyAttendance() {
        log.info("=== [SCHEDULER] Starting scheduled attendance finalization at 3:00 PM IST ===");

        try {
            if (attendanceService.isTodayAttendanceMarked()) {
                log.info("=== [SCHEDULER] Attendance already finalized for today, skipping scheduled job ===");
                return;
            }

            log.info("=== [SCHEDULER] No attendance record found for today, proceeding to mark absent for unmarked students ===");
            List<Student> students = studentRepository.findAll();
            for (Student student : students) {
                attendanceService.markAbsentIfNotMarkedToday(student);
            }

            attendanceReportService.generateDailyReport();
            log.info("=== [SCHEDULER] Scheduled attendance finalization completed successfully ===");

        } catch (Exception e) {
            log.error("=== [SCHEDULER] Error during scheduled attendance finalization ===", e);
        }
    }
}