package com.example.demo.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dto.PrincipalAnalyticsDTO;
import com.example.demo.dto.PrincipalCourseDTO;
import com.example.demo.dto.PrincipalPageResponseDTO;
import com.example.demo.dto.PrincipalStudentDTO;
import com.example.demo.dto.PrincipalTeacherDTO;
import com.example.demo.entity.Role;
import com.example.demo.entity.Student;
import com.example.demo.entity.User;
import com.example.demo.repository.AttendanceRepository;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.AuthService;

import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping({"/principal", "/api/principal"})
public class PrincipalController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    // ==================== ADMIN MANAGEMENT ====================

    @PostMapping("/admins")
    public ResponseEntity<?> createAdmin(@RequestBody Map<String, String> req) {
        log.info("[PRINCIPAL] Creating new admin: {}", req.get("username"));

        try {
            String username = req.get("username");
            String email = req.get("email");
            String fullName = req.get("fullName");
            String password = req.get("password");

            // Validate
            if (username == null || username.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username is required"));
            }
            if (email == null || email.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }
            if (password == null || password.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
            }

            // Check if user already exists
            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
            }

            // Create admin user
            User admin = new User();
            admin.setUsername(username);
            admin.setEmail(email);
            admin.setFullName(fullName != null ? fullName : username);
            admin.setPasswordHash(passwordEncoder.encode(password));
            admin.setRole(Role.ADMIN);
            admin.setMustChangePassword(true);

            User savedAdmin = userRepository.save(admin);
            log.info("[PRINCIPAL] Admin created successfully: {}", savedAdmin.getUsername());

            Map<String, Object> response = new HashMap<>();
            response.put("teacher", toTeacherDto(savedAdmin));
            response.put("message", "Admin created successfully");
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            log.error("Principal endpoint failed: createAdmin", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create admin: " + e.getMessage()));
        }
    }

    @GetMapping("/admins")
    public ResponseEntity<?> getAdmins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("[PRINCIPAL] Fetching all admins");

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<User> admins = userRepository.findByRole(Role.ADMIN, pageable);
            List<PrincipalTeacherDTO> teacherDtos = admins.getContent().stream()
                    .map(this::toTeacherDto)
                    .toList();

            return ResponseEntity.ok(new PrincipalPageResponseDTO<>(
                    teacherDtos,
                    admins.getTotalPages(),
                    admins.getTotalElements(),
                    admins.getSize(),
                    admins.getNumber()
            ));

        } catch (Exception e) {
            log.error("Principal endpoint failed: getAdmins", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch admins", "message", e.getMessage()));
        }
    }

    @PutMapping("/admins/{id}")
    public ResponseEntity<?> updateAdmin(@PathVariable Long id, @RequestBody Map<String, String> req) {
        log.info("[PRINCIPAL] Updating admin: {}", id);

        try {
            User admin = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Admin not found"));

            if (!admin.getRole().equals(Role.ADMIN)) {
                return ResponseEntity.badRequest().body(Map.of("error", "User is not an admin"));
            }

            if (req.containsKey("email")) {
                admin.setEmail(req.get("email"));
            }
            if (req.containsKey("fullName")) {
                admin.setFullName(req.get("fullName"));
            }

            User updated = userRepository.save(admin);
            log.info("[PRINCIPAL] Admin updated: {}", updated.getUsername());

            Map<String, Object> response = new HashMap<>();
            response.put("teacher", toTeacherDto(updated));
            response.put("message", "Admin updated successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Principal endpoint failed: updateAdmin id={}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update admin"));
        }
    }

    @DeleteMapping("/admins/{id}")
    public ResponseEntity<?> deleteAdmin(@PathVariable Long id) {
        log.info("[PRINCIPAL] Deleting admin: {}", id);

        try {
            User admin = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Admin not found"));

            if (!admin.getRole().equals(Role.ADMIN)) {
                return ResponseEntity.badRequest().body(Map.of("error", "User is not an admin"));
            }

            userRepository.deleteById(id);
            log.info("[PRINCIPAL] Admin deleted: {}", admin.getUsername());

            return ResponseEntity.ok(Map.of("message", "Admin deleted successfully"));

        } catch (Exception e) {
            log.error("Principal endpoint failed: deleteAdmin id={}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete admin"));
        }
    }

    @PutMapping("/admins/{adminId}/reset-password")
    public ResponseEntity<?> resetAdminPassword(
            @PathVariable Long adminId,
            @RequestBody Map<String, String> request) {
        log.info("[PRINCIPAL] Resetting password for admin id: {}", adminId);

        try {
            // Validate request
            String newPassword = request.get("newPassword");
            if (newPassword == null || newPassword.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "New password is required"));
            }

            // Verify target user is ADMIN
            User admin = userRepository.findById(adminId)
                    .orElseThrow(() -> new RuntimeException("Admin not found"));

            if (!admin.getRole().equals(Role.ADMIN)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "User is not an admin",
                    "actualRole", admin.getRole() != null ? admin.getRole().name() : "UNKNOWN"
                ));
            }

            // Reset password via AuthService (validates and encodes)
            var changeResponse = authService.resetAdminPassword(adminId, newPassword);

            log.info("[PRINCIPAL] Password reset successfully for admin: {}", admin.getUsername());

            // Return updated admin info
            User updatedAdmin = userRepository.findById(adminId).orElse(admin);
            Map<String, Object> response = new HashMap<>();
            response.put("admin", toTeacherDto(updatedAdmin));
            response.put("message", changeResponse.message());
            response.put("notice", "Admin must change password on next login");

            return ResponseEntity.ok(response);

        } catch (org.springframework.web.server.ResponseStatusException e) {
            log.error("[PRINCIPAL] Password reset failed: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(Map.of(
                "error", "Failed to reset password",
                "message", e.getReason()
            ));
        } catch (Exception e) {
            log.error("Principal endpoint failed: resetAdminPassword id={}", adminId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to reset admin password", "message", e.getMessage()));
        }
    }

    // ==================== ANALYTICS ====================

    @GetMapping("/analytics/dashboard")
    public ResponseEntity<?> getDashboardAnalytics() {
        log.info("[PRINCIPAL] Fetching dashboard analytics");

        try {
            long totalStudents = studentRepository.count();
            long totalAdmins = userRepository.countByRole(Role.ADMIN);
            long totalPrincipals = userRepository.countByRole(Role.PRINCIPAL);
            long totalCourses = courseRepository.count();
            long totalAttendanceMarkings = attendanceRepository.count();

            return ResponseEntity.ok(new PrincipalAnalyticsDTO(
                    totalStudents,
                    totalAdmins,
                    totalPrincipals,
                    totalCourses,
                    totalAttendanceMarkings
            ));

        } catch (Exception e) {
            log.error("Principal endpoint failed: getDashboardAnalytics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch analytics"));
        }
    }

    @GetMapping("/students")
    public ResponseEntity<?> getStudents(
            @RequestParam(required = false) Long adminId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("[PRINCIPAL] Fetching students adminId={} page={} size={}", adminId, page, size);

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Student> students = adminId == null
                    ? studentRepository.findAll(pageable)
                    : studentRepository.findByCourse_Teacher_Id(adminId, pageable);
            List<PrincipalStudentDTO> studentDtos = students.getContent().stream()
                    .map(this::toStudentDto)
                    .toList();

            return ResponseEntity.ok(new PrincipalPageResponseDTO<>(
                    studentDtos,
                    students.getTotalPages(),
                    students.getTotalElements(),
                    students.getSize(),
                    students.getNumber()
            ));

        } catch (Exception e) {
            log.error("Principal endpoint failed: getStudents page={} size={}", page, size, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch students", "message", e.getMessage()));
        }
    }

    @GetMapping("/courses")
    public ResponseEntity<?> getCourses() {
        log.info("[PRINCIPAL] Fetching all courses");

        try {
            List<PrincipalCourseDTO> courses = courseRepository.findAll().stream()
                    .map(this::toCourseDto)
                    .toList();

            return ResponseEntity.ok(Map.of(
                    "courses", courses,
                    "totalCourses", courses.size()
            ));

        } catch (Exception e) {
            log.error("Principal endpoint failed: getCourses", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch courses", "message", e.getMessage()));
        }
    }

    @GetMapping("/attendance")
    public ResponseEntity<?> getAttendanceStatistics() {
        log.info("[PRINCIPAL] Fetching attendance statistics");

        try {
            long totalMarkings = attendanceRepository.count();

            return ResponseEntity.ok(Map.of(
                    "totalMarkings", totalMarkings
            ));

        } catch (Exception e) {
            log.error("Principal endpoint failed: getAttendanceStatistics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch attendance statistics"));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "Principal service is running"));
    }

    private PrincipalTeacherDTO toTeacherDto(User admin) {
        return new PrincipalTeacherDTO(
                admin.getId(),
                admin.getUsername(),
                admin.getEmail(),
                admin.getFullName(),
                admin.getRole() != null ? admin.getRole().name() : null,
                admin.getMustChangePassword()
        );
    }

    private PrincipalStudentDTO toStudentDto(Student student) {
        User user = student.getUser();
        String fullName = firstNonBlank(
                user != null ? user.getFullName() : null,
                student.getFullName(),
                "N/A"
        );
        String email = firstNonBlank(user != null ? user.getEmail() : null, "N/A");
        String status = Optional.ofNullable(student.getStatus())
                .map(Enum::name)
                .orElse("ACTIVE");

        return new PrincipalStudentDTO(
                student.getId(),
                student.getRollNumber(),
                fullName,
                email,
                status
        );
    }

    private PrincipalCourseDTO toCourseDto(com.example.demo.entity.Course course) {
        return new PrincipalCourseDTO(
                course.getId(),
                course.getTitle(),
                course.getDuration(),
                course.getDescription(),
                course.getCreatedBy()
        );
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
