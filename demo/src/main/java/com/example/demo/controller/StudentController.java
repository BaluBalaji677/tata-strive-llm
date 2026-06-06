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
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.repository.StudentRepository;
import com.example.demo.service.StudentService;
import com.example.demo.service.TeacherAccessService;

@RestController
@RequestMapping("/students")
public class StudentController {

    private final StudentRepository studentRepository;
    private final StudentService studentService;
    private final TeacherAccessService teacherAccessService;

    public StudentController(
            StudentRepository studentRepository,
            StudentService studentService,
            TeacherAccessService teacherAccessService
    ) {
        this.studentRepository = studentRepository;
        this.studentService = studentService;
        this.teacherAccessService = teacherAccessService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    public List<StudentListResponse> getAllStudents() {
        User currentUser = teacherAccessService.requireCurrentUser();
        List<Student> students;
        
        // Principal sees all students, Admin sees only their own students
        if (Role.PRINCIPAL.equals(currentUser.getRole())) {
            students = studentRepository.findAll();
        } else {
            students = studentRepository.findByCourse_Teacher_Id(currentUser.getId());
        }

        List<StudentListResponse> response = students.stream()
                .map(this::toResponse)
                .toList();
        System.out.println("GET /students response sample: " + (response.isEmpty() ? "[]" : response.get(0)));
        return response;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    public StudentListResponse createStudent(@RequestBody StudentCreateRequest request) {
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
                request.status(),
                request.courseId()
        );
        return toResponse(created);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    public void deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
    }

    @PostMapping("/backfill-users")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    public BackfillResponse backfillUsers() {
        int linked = studentService.backfillMissingStudentUsers();
        return new BackfillResponse(linked);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    public StudentListResponse updateStudent(@PathVariable Long id, @RequestBody StudentCreateRequest request) {
        Student updated = studentService.updateStudent(
                id,
                request.fullName(),
                request.username(),
                request.rollNumber(),
                request.status(),
                request.courseId()
        );
        return toResponse(updated);
    }

    // Diagnostic endpoints for admin
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public List<StudentListResponse> getAllStudentsAdmin() {
        // Principal only - show all students in system
        List<Student> students = studentRepository.findAll();
        return students.stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/admin/orphaned")
    @PreAuthorize("hasRole('PRINCIPAL') or hasRole('ADMIN')")
    public OrphanedStudentsResponse getOrphanedStudents() {
        User currentUser = teacherAccessService.requireCurrentUser();
        List<Student> studentsWithoutCourse;
        List<Student> studentsWithoutTeacher;

        if (Role.PRINCIPAL.equals(currentUser.getRole())) {
            studentsWithoutCourse = studentRepository.findStudentsWithoutCourse();
            studentsWithoutTeacher = studentRepository.findStudentsWithoutTeacher();
        } else {
            studentsWithoutCourse = List.of();
            studentsWithoutTeacher = List.of();
        }
        
        return new OrphanedStudentsResponse(
                studentsWithoutCourse.stream().map(this::toResponse).toList(),
                studentsWithoutTeacher.stream().map(this::toResponse).toList(),
                studentsWithoutCourse.size() + studentsWithoutTeacher.size()
        );
    }

    @PostMapping("/admin/{id}/assign-course")
    @PreAuthorize("hasRole('PRINCIPAL') or hasRole('ADMIN')")
    public StudentListResponse assignStudentToCourse(
            @PathVariable Long id,
            @RequestBody AssignCourseRequest request
    ) {
        Student student = studentService.updateStudent(
                id,
                null,
                null,
                null,
                null,
                request.courseId()
        );
        return toResponse(student);
    }

    private StudentListResponse toResponse(Student student) {
        String email = student.getUser() != null ? student.getUser().getUsername() : "";
        Long courseId = student.getCourse() != null ? student.getCourse().getId() : null;
        String courseTitle = student.getCourse() != null ? student.getCourse().getTitle() : null;

        return new StudentListResponse(
                student.getId(),
                student.getRollNumber(),
                student.getFullName(),
                student.getStatus() != null ? student.getStatus().name() : null,
                email,
                email,
                courseId,
                courseTitle
        );
    }

    public record StudentCreateRequest(
            String fullName,
            String username,
            String rollNumber,
            String status,
            Long courseId
    ) {}

    public record AssignCourseRequest(
            Long courseId
    ) {}

    public record OrphanedStudentsResponse(
            List<StudentListResponse> studentsWithoutCourse,
            List<StudentListResponse> studentsWithoutTeacher,
            int totalOrphaned
    ) {}

    public record StudentListResponse(
            Long id,
            String rollNumber,
            String fullName,
            String status,
            String email,
            String username,
            Long courseId,
            String courseTitle
    ) {}

    public record BackfillResponse(int linkedCount) {}
}
