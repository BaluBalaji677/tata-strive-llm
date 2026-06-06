package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.entity.Student;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.TeacherAccessService;

@RestController
@RequestMapping("/admin/students")
@PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
public class AdminStudentController {

    private final TeacherAccessService teacherAccessService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminStudentController(
            TeacherAccessService teacherAccessService,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.teacherAccessService = teacherAccessService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PutMapping("/{studentId}/reset-password")
    public ResetResponse resetStudentPassword(
            @PathVariable Long studentId,
            @RequestBody ResetRequest request
    ) {
        // Enforces that Admin only accesses their own students (Principal can access all)
        Student student = teacherAccessService.requireStudentAccess(studentId);

        User user = student.getUser();
        if (user == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Student has no associated user account"
            );
        }

        if (request.newPassword() == null || request.newPassword().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "New password is required"
            );
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setMustChangePassword(true);
        userRepository.save(user);

        return new ResetResponse("Password reset successfully.");
    }

    public record ResetRequest(String newPassword) {}

    public record ResetResponse(String message) {}
}
