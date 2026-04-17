package com.example.demo.controller;

import java.util.List;

import com.example.demo.entity.Student;
import com.example.demo.repository.StudentRepository;
import com.example.demo.service.StudentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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