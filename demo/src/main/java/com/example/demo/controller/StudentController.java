package com.example.demo.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.Student;
import com.example.demo.repository.StudentRepository;
import com.example.demo.service.StudentService;

@RestController
@RequestMapping("/students")
public class StudentController {

    private final StudentRepository studentRepository;
    private final StudentService studentService;

    public StudentController(StudentRepository studentRepository, StudentService studentService) {
        this.studentRepository = studentRepository;
        this.studentService = studentService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<StudentListResponse> getAllStudents() {
        List<StudentListResponse> response = studentRepository.findAllWithUser().stream()
                .map(this::toResponse)
                .toList();
        System.out.println("GET /students response sample: " + (response.isEmpty() ? "[]" : response.get(0)));
        return response;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public StudentListResponse createStudent(@RequestBody StudentCreateRequest request) {
        // Debug logging
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            System.out.println("=== DEBUG /students POST ===");
            System.out.println("Authenticated username: " + auth.getName());
            System.out.println("Granted authorities: " + auth.getAuthorities());
            System.out.println("Request path: /students (POST)");
            System.out.println("============================");
        }

        Student created = studentService.createStudent(
                request.fullName(),
                request.username(),
                request.rollNumber(),
                request.status()
        );
        return toResponse(created);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
    }

    @PostMapping("/backfill-users")
    @PreAuthorize("hasRole('ADMIN')")
    public BackfillResponse backfillUsers() {
        int linked = studentService.backfillMissingStudentUsers();
        return new BackfillResponse(linked);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public StudentListResponse updateStudent(@PathVariable Long id, @RequestBody StudentCreateRequest request) {
        Student updated = studentService.updateStudent(
                id,
                request.fullName(),
                request.username(),
                request.rollNumber(),
                request.status()
        );
        return toResponse(updated);
    }

    private StudentListResponse toResponse(Student student) {
        String email = student.getUser() != null ? student.getUser().getUsername() : "";
        return new StudentListResponse(
                student.getId(),
                student.getRollNumber(),
                student.getFullName(),
                student.getStatus() != null ? student.getStatus().name() : null,
                email,
                email
        );
    }

    public record StudentCreateRequest(
            String fullName,
            String username,
            String rollNumber,
            String status
    ) {}

    public record StudentListResponse(
            Long id,
            String rollNumber,
            String fullName,
            String status,
            String email,
            String username
    ) {}

    public record BackfillResponse(int linkedCount) {}
}