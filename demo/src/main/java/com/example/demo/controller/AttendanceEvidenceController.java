package com.example.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.AttendanceEvidenceDto;
import com.example.demo.service.AttendanceEvidenceService;

@RestController
@RequestMapping("/api/teacher/attendance/evidence")
public class AttendanceEvidenceController {

    private final AttendanceEvidenceService evidenceService;

    public AttendanceEvidenceController(AttendanceEvidenceService evidenceService) {
        this.evidenceService = evidenceService;
    }

    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL')")
    @GetMapping
    public ResponseEntity<List<AttendanceEvidenceDto>> getEvidence() {
        List<AttendanceEvidenceDto> evidence = evidenceService.getRecentEvidenceForCurrentTeacher();
        return ResponseEntity.ok(evidence);
    }

    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL')")
    @PostMapping
    public ResponseEntity<AttendanceEvidenceDto> uploadEvidence(@RequestBody AttendanceEvidenceRequest request) {
        var evidence = evidenceService.saveEvidence(request.imageBase64(), request.attendanceSessionId());
        return ResponseEntity.status(HttpStatus.CREATED).body(new AttendanceEvidenceDto(
                evidence.getId(),
                evidence.getImageUrl(),
                evidence.getPublicId(),
                evidence.getCapturedAt().toString(),
                evidence.getExpiresAt().toString(),
                evidence.getAttendanceSessionId()));
    }

    public record AttendanceEvidenceRequest(String imageBase64, String attendanceSessionId) {}
}
