package com.example.demo.service;

import java.util.List;

import com.example.demo.dto.AttendanceEvidenceDto;
import com.example.demo.entity.AttendanceEvidence;

public interface AttendanceEvidenceService {

    AttendanceEvidence saveEvidence(String imageBase64, String attendanceSessionId);

    List<AttendanceEvidenceDto> getRecentEvidenceForCurrentTeacher();

    void cleanupExpiredEvidence();
}
