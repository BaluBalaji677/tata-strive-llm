package com.example.demo.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.demo.entity.Attendance;
import com.example.demo.entity.Student;
import com.example.demo.repository.AttendanceRepository;
import com.example.demo.repository.StudentRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepo;
    private final StudentRepository studentRepo;

    public AttendanceServiceImpl(AttendanceRepository attendanceRepo, StudentRepository studentRepo) {
        this.attendanceRepo = attendanceRepo;
        this.studentRepo = studentRepo;
    }

    @Override
    public List<Attendance> getAllAttendance(String rollNumber) {
        System.out.println("=== [ADMIN] Fetching ALL Attendance ===");
        if (rollNumber != null && !rollNumber.isBlank()) {
            return studentRepo.findByRollNumber(rollNumber)
                    .map(attendanceRepo::findByStudentOrderByDateAsc)
                    .orElse(java.util.List.of());
        }
        return attendanceRepo.findAll();
    }

    @Override
    public Attendance markTodayAttendance(String rollNumber, boolean present) {
        if (rollNumber == null || rollNumber.isBlank()) {
            throw new RuntimeException("rollNumber is required");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("=== [ADMIN] Mark Attendance Requested ===");
        System.out.println("JWT auth name: " + (auth != null ? auth.getName() : "null"));
        System.out.println("JWT authorities: " + (auth != null ? auth.getAuthorities() : "null"));
        System.out.println("Target rollNumber: " + rollNumber);
        System.out.println("Present: " + present);

        Student student = studentRepo.findByRollNumber(rollNumber)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        LocalDate today = LocalDate.now();
        System.out.println("Resolved student: id=" + student.getId() + ", rollNumber=" + student.getRollNumber());

        // Prevent duplicate attendance for the same day.
        if (attendanceRepo.findByStudentAndDate(student, today).isPresent()) {
            throw new RuntimeException("Attendance already marked for today");
        }

        Attendance a = new Attendance();
        a.setStudent(student);
        a.setDate(today);
        a.setPresent(present);
        a.setMarkedByAdmin(true);
        a.setStatus(present ? "PRESENT" : "ABSENT");

        // createdAt is initialized by entity default, but we set it explicitly for clarity.
        System.out.println("Saving attendance for date=" + today.format(DateTimeFormatter.ISO_DATE));
        Attendance saved = attendanceRepo.save(a);

        // Keep student status in sync after attendance is marked.
        refreshStudentStatus(student);

        return saved;
    }

    @Override
    public List<Attendance> getMyAttendance() {
        Student student = getCurrentStudent();
        // Keep student status updated when attendance is viewed.
        refreshStudentStatus(student);
        return attendanceRepo.findByStudentOrderByDateAsc(student);
    }

    @Override
    public AttendanceSummary getMyAttendanceSummary() {
        Student student = getCurrentStudent();
        AttendanceMetrics metrics = calculateMetrics(student);
        String status = toSmartStatus(metrics.percentage());

        // Round to 2 decimals for clean API output.
        double rounded = Math.round(metrics.percentage() * 100.0) / 100.0;

        refreshStudentStatus(student);
        return new AttendanceSummary(rounded, status);
    }

    private String toSmartStatus(double percentage) {
        if (percentage >= 75.0) {
            return "ACTIVE";
        }
        if (percentage >= 50.0) {
            return "WARNING";
        }
        return "REJECTED";
    }

    private Student getCurrentStudent() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new RuntimeException("Unauthorized");
        }

        // Student identity is rollNumber (JWT subject).
        String rollNumber = auth.getName();
        System.out.println("=== [STUDENT] Attendance Lookup ===");
        System.out.println("JWT auth name (rollNumber): " + rollNumber);
        System.out.println("JWT authorities: " + auth.getAuthorities());

        return studentRepo.findByRollNumber(rollNumber)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    private void refreshStudentStatus(Student student) {
        AttendanceMetrics metrics = calculateMetrics(student);
        Student.Status newStatus = toStudentStatus(metrics.percentage());
        if (student.getStatus() != newStatus) {
            student.setStatus(newStatus);
            studentRepo.save(student);
            System.out.println("Student status updated to: " + newStatus);
        }
    }

    private AttendanceMetrics calculateMetrics(Student student) {
        long totalDays = attendanceRepo.countByStudent(student);
        long presentDays = attendanceRepo.countByStudentAndPresentTrue(student);
        double percentage = totalDays == 0 ? 0.0 : (presentDays * 100.0) / totalDays;
        return new AttendanceMetrics(totalDays, presentDays, percentage);
    }

    private Student.Status toStudentStatus(double percentage) {
        if (percentage >= 75.0) {
            return Student.Status.ACTIVE;
        }
        if (percentage >= 50.0) {
            return Student.Status.WARNING;
        }
        return Student.Status.REJECTED;
    }

    private record AttendanceMetrics(long totalDays, long presentDays, double percentage) {}

    @Override
    public void markAbsentIfNotMarkedToday(Student student) {
        LocalDate today = LocalDate.now();

        // Check if attendance already exists for today
        if (attendanceRepo.findByStudentAndDate(student, today).isPresent()) {
            // Do nothing if already marked
            return;
        }

        // Create absent record
        Attendance attendance = new Attendance();
        attendance.setStudent(student);
        attendance.setDate(today);
        attendance.setPresent(false);
        attendance.setMarkedByAdmin(false); // Automated, not by admin
        attendance.setStatus("ABSENT");

        attendanceRepo.save(attendance);

        // Log the action
        System.out.println("Auto marking absent for student: " + student.getRollNumber());

        // Refresh student status after marking absent
        refreshStudentStatus(student);
    }

    @Override
    public boolean isTodayAttendanceMarked() {
        LocalDate today = LocalDate.now();
        return attendanceRepo.countByDate(today) > 0;
    }

    @Override
    public void finalizeTodayAttendanceIfNeeded() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        LocalTime now = LocalTime.now(ZoneId.of("Asia/Kolkata"));
        LocalTime cutoff = LocalTime.of(15, 0); // 3:00 PM

        // Prevent auto-marking attendance before the 3:00 PM cutoff
        if (now.isBefore(cutoff)) {
            log.debug("=== [FINALIZE] Current time {} IST is before cutoff {} IST, skipping auto-mark ===", now, cutoff);
            return;
        }

        log.info("=== [FINALIZE] Current time {} IST is at/after cutoff {} IST, proceeding with auto-mark ===", now, cutoff);

        try {
            List<Student> students = studentRepo.findAll();
            for (Student student : students) {
                // markAbsentIfNotMarkedToday already checks for duplicates and won't overwrite existing records
                markAbsentIfNotMarkedToday(student);
            }

            log.info("=== [FINALIZE] Auto-mark finalization completed for {} students on {}", students.size(), today);
        } catch (Exception e) {
            log.error("=== [FINALIZE] Error during auto-mark process ===", e);
            throw new RuntimeException("Failed to finalize attendance", e);
        }
    }
}

