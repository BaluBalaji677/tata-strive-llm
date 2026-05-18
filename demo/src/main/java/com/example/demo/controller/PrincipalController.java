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

import com.example.demo.entity.Role;
import com.example.demo.entity.Student;
import com.example.demo.entity.User;
import com.example.demo.repository.AttendanceRepository;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/principal")
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

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "id", savedAdmin.getId(),
                    "username", savedAdmin.getUsername(),
                    "email", savedAdmin.getEmail(),
                    "fullName", savedAdmin.getFullName(),
                    "role", savedAdmin.getRole().toString(),
                    "message", "Admin created successfully"
            ));

        } catch (Exception e) {
            log.error("[PRINCIPAL] Error creating admin", e);
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

            Map<String, Object> response = new HashMap<>();
            response.put("content", admins.getContent().stream().map(admin -> Map.of(
                    "id", admin.getId(),
                    "username", admin.getUsername(),
                    "email", admin.getEmail(),
                    "fullName", admin.getFullName(),
                    "role", admin.getRole().toString(),
                    "mustChangePassword", admin.getMustChangePassword()
            )).toList());
            response.put("totalElements", admins.getTotalElements());
            response.put("totalPages", admins.getTotalPages());
            response.put("currentPage", page);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("[PRINCIPAL] Error fetching admins", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch admins"));
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

            return ResponseEntity.ok(Map.of(
                    "id", updated.getId(),
                    "username", updated.getUsername(),
                    "email", updated.getEmail(),
                    "fullName", updated.getFullName(),
                    "message", "Admin updated successfully"
            ));

        } catch (Exception e) {
            log.error("[PRINCIPAL] Error updating admin", e);
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
            log.error("[PRINCIPAL] Error deleting admin", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete admin"));
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

            Map<String, Object> analytics = new HashMap<>();
            analytics.put("totalStudents", totalStudents);
            analytics.put("totalAdmins", totalAdmins);
            analytics.put("totalPrincipals", totalPrincipals);
            analytics.put("totalCourses", totalCourses);
            analytics.put("totalAttendanceMarkings", totalAttendanceMarkings);

            return ResponseEntity.ok(analytics);

        } catch (Exception e) {
            log.error("[PRINCIPAL] Error fetching analytics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch analytics"));
        }
    }

    @GetMapping("/students")
    public ResponseEntity<?> getStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("[PRINCIPAL] Fetching all students");

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Student> students = studentRepository.findAll(pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("content", students.getContent().stream().map(student -> {
                User user = student.getUser();
                return Map.of(
                        "id", student.getId(),
                        "rollNumber", student.getRollNumber(),
                        "fullName", user != null ? user.getFullName() : "N/A",
                        "email", user != null ? user.getEmail() : "N/A"
                );
            }).toList());
            response.put("totalElements", students.getTotalElements());
            response.put("totalPages", students.getTotalPages());
            response.put("currentPage", page);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("[PRINCIPAL] Error fetching students", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch students"));
        }
    }

    @GetMapping("/courses")
    public ResponseEntity<?> getCourses() {
        log.info("[PRINCIPAL] Fetching all courses");

        try {
            var courses = courseRepository.findAll();
            return ResponseEntity.ok(Map.of(
                    "courses", courses,
                    "totalCourses", courses.size()
            ));

        } catch (Exception e) {
            log.error("[PRINCIPAL] Error fetching courses", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch courses"));
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
            log.error("[PRINCIPAL] Error fetching attendance", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch attendance statistics"));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "Principal service is running"));
    }
}
