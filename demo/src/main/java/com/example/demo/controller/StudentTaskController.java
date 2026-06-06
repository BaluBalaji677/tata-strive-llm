package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.entity.Student;
import com.example.demo.entity.TaskAssignment;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TaskAssignmentRepository;

@RestController
public class StudentTaskController {

    private final TaskAssignmentRepository taskAssignmentRepository;
    private final StudentRepository studentRepository;

    public StudentTaskController(
            TaskAssignmentRepository taskAssignmentRepository,
            StudentRepository studentRepository
    ) {
        this.taskAssignmentRepository = taskAssignmentRepository;
        this.studentRepository = studentRepository;
    }

    public record StudentTaskResponse(
            Long id,
            Long taskId,
            String title,
            String description,
            String dueDate,
            String status,
            String completedAt
    ) {}

    @GetMapping("/student/tasks")
    public ResponseEntity<List<StudentTaskResponse>> getTasks() {
        Student currentStudent = getCurrentStudent();
        List<TaskAssignment> assignments = taskAssignmentRepository.findByStudentAndTask_ActiveTrueOrderByTask_DueDateAsc(currentStudent);

        List<StudentTaskResponse> response = assignments.stream()
                .map(this::toStudentTaskResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/student/tasks/{assignmentId}/submit")
    public ResponseEntity<StudentTaskResponse> submitTask(@PathVariable Long assignmentId) {
        Student currentStudent = getCurrentStudent();
        TaskAssignment assignment = taskAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task assignment not found"));

        // Enforce that only the assigned student can submit
        if (!assignment.getStudent().getId().equals(currentStudent.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to submit this assignment");
        }

        // Prevent submitting twice
        if ("COMPLETED".equalsIgnoreCase(assignment.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Task assignment has already been completed");
        }

        assignment.setStatus("COMPLETED");
        assignment.setCompletedAt(LocalDateTime.now());
        taskAssignmentRepository.save(assignment);

        return ResponseEntity.ok(toStudentTaskResponse(assignment));
    }

    private Student getCurrentStudent() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        String username = auth.getName();
        return studentRepository.findByRollNumber(username)
                .or(() -> studentRepository.findByUser_Username(username))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student record not found"));
    }

    private StudentTaskResponse toStudentTaskResponse(TaskAssignment ta) {
        return new StudentTaskResponse(
                ta.getId(),
                ta.getTask().getId(),
                ta.getTask().getTitle(),
                ta.getTask().getDescription(),
                ta.getTask().getDueDate() != null ? ta.getTask().getDueDate().toString() : null,
                ta.getStatus(),
                ta.getCompletedAt() != null ? ta.getCompletedAt().toString() : null
        );
    }
}
