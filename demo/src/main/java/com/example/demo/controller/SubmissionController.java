package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.entity.Submission;
import com.example.demo.entity.SubmissionStatus;
import com.example.demo.service.SubmissionService;

@RestController
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    // =======================
    // STUDENT
    // =======================

    @PostMapping("/student/submissions")
    public ResponseEntity<SubmitResponse> submit(@RequestBody SubmitRequest req) {
        Submission created = submissionService.submitTask(
                req.courseDayId(),
                req.submissionText(),
                req.fileUrl(),
                req.githubLink()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SubmitResponse(created.getId(), created.getStatus()));
    }

    @GetMapping("/student/submissions")
    public ResponseEntity<List<SubmissionResponse>> mySubmissions() {
        List<Submission> list = submissionService.getMySubmissions();
        return ResponseEntity.ok(list.stream().map(this::toResponse).toList());
    }

    // =======================
    // ADMIN
    // =======================

    @GetMapping("/admin/submissions")
    public ResponseEntity<List<SubmissionResponse>> allSubmissions() {
        List<Submission> list = submissionService.getAllSubmissions();
        return ResponseEntity.ok(list.stream().map(this::toResponse).toList());
    }

    @GetMapping("/admin/submissions/{studentId}")
    public ResponseEntity<List<SubmissionResponse>> submissionsByStudent(@PathVariable Long studentId) {
        List<Submission> list = submissionService.getSubmissionsByStudent(studentId);
        return ResponseEntity.ok(list.stream().map(this::toResponse).toList());
    }

    @PutMapping("/admin/submissions/{id}/status")
    public ResponseEntity<SubmissionResponse> updateStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest req) {
        Submission updated = submissionService.updateStatus(id, req.status());
        return ResponseEntity.ok(toResponse(updated));
    }

    @PutMapping("/admin/submissions/{id}/evaluate")
    public ResponseEntity<SubmissionResponse> evaluate(@PathVariable Long id, @RequestBody EvaluateRequest req) {
        Submission updated = submissionService.evaluate(id, req.marks(), req.feedback());
        return ResponseEntity.ok(toResponse(updated));
    }

    private SubmissionResponse toResponse(Submission s) {
        return new SubmissionResponse(
                s.getId(),
                s.getStatus(),
                s.getMarks(),
                s.getFeedback(),
                s.getSubmittedAt(),
                s.getStudent() != null ? s.getStudent().getId() : null,
                s.getCourseDay() != null ? s.getCourseDay().getId() : null
        );
    }

    // =======================
    // DTOs
    // =======================

    public record SubmitRequest(
            Long courseDayId,
            String submissionText,
            String fileUrl,
            String githubLink
    ) {}

    public record SubmitResponse(
            Long id,
            SubmissionStatus status
    ) {}

    public record UpdateStatusRequest(SubmissionStatus status) {}

    public record EvaluateRequest(
            Integer marks,
            String feedback
    ) {}

    public record SubmissionResponse(
            Long id,
            SubmissionStatus status,
            Integer marks,
            String feedback,
            LocalDateTime submittedAt,
            Long studentId,
            Long courseDayId
    ) {}
}

