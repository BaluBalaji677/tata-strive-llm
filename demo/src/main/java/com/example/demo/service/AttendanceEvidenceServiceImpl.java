package com.example.demo.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.demo.dto.AttendanceEvidenceDto;
import com.example.demo.entity.AttendanceEvidence;
import com.example.demo.entity.User;
import com.example.demo.repository.AttendanceEvidenceRepository;

@Service
public class AttendanceEvidenceServiceImpl implements AttendanceEvidenceService {

    private static final int EVIDENCE_RETENTION_DAYS = 3;

    private final AttendanceEvidenceRepository evidenceRepository;
    private final TeacherAccessService teacherAccessService;
    private final Cloudinary cloudinary;

    public AttendanceEvidenceServiceImpl(
            AttendanceEvidenceRepository evidenceRepository,
            TeacherAccessService teacherAccessService,
            Cloudinary cloudinary
    ) {
        this.evidenceRepository = evidenceRepository;
        this.teacherAccessService = teacherAccessService;
        this.cloudinary = cloudinary;
    }

    @Override
    @Transactional
    public AttendanceEvidence saveEvidence(String imageBase64, String attendanceSessionId) {
        User currentUser = teacherAccessService.requireCurrentUser();
        if (!teacherAccessService.isTeacher(currentUser) && !teacherAccessService.isPrincipal(currentUser)) {
            throw new RuntimeException("Teacher or principal access required");
        }

        String imagePayload = stripBase64Prefix(imageBase64);
        byte[] decoded = Base64.getDecoder().decode(imagePayload);

        Map<String, Object> uploadParams = new HashMap<>();
        uploadParams.put("folder", "attendance_evidence");
        uploadParams.put("resource_type", "image");
        uploadParams.put("overwrite", false);

        Map<?, ?> uploadResult;
        try {
            uploadResult = cloudinary.uploader().upload(decoded, uploadParams);
        } catch (IOException | RuntimeException e) {
            throw new RuntimeException("Failed to upload attendance evidence image", e);
        }

        String imageUrl = uploadResult.get("secure_url") != null ? uploadResult.get("secure_url").toString() : uploadResult.get("url").toString();
        String publicId = uploadResult.get("public_id").toString();

        AttendanceEvidence evidence = new AttendanceEvidence();
        evidence.setImageUrl(imageUrl);
        evidence.setPublicId(publicId);
        evidence.setCapturedAt(LocalDateTime.now());
        evidence.setExpiresAt(LocalDateTime.now().plusDays(EVIDENCE_RETENTION_DAYS));
        evidence.setAttendanceSessionId(attendanceSessionId);
        evidence.setTeacher(currentUser);

        return evidenceRepository.save(evidence);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceEvidenceDto> getRecentEvidenceForCurrentTeacher() {
        User currentUser = teacherAccessService.requireCurrentUser();
        List<AttendanceEvidence> evidence;
        LocalDateTime now = LocalDateTime.now();

        if (teacherAccessService.isPrincipal(currentUser)) {
            evidence = evidenceRepository.findByExpiresAtAfterOrderByCapturedAtDesc(now);
        } else {
            evidence = evidenceRepository.findByTeacher_IdAndExpiresAtAfterOrderByCapturedAtDesc(currentUser.getId(), now);
        }

        return evidence.stream()
                .map(e -> new AttendanceEvidenceDto(
                        e.getId(),
                        e.getImageUrl(),
                        e.getPublicId(),
                        e.getCapturedAt().toString(),
                        e.getExpiresAt().toString(),
                        e.getAttendanceSessionId()))
                .collect(Collectors.toList());
    }

    private String stripBase64Prefix(String dataUrl) {
        if (dataUrl == null) {
            throw new IllegalArgumentException("Image payload is required");
        }
        int commaIndex = dataUrl.indexOf(',');
        if (commaIndex >= 0) {
            return dataUrl.substring(commaIndex + 1);
        }
        return dataUrl;
    }

    @Override
    @Transactional
    public void cleanupExpiredEvidence() {
        LocalDateTime now = LocalDateTime.now();
        List<AttendanceEvidence> expired = evidenceRepository.findByExpiresAtBefore(now);
        expired.forEach(e -> {
            try {
                cloudinary.uploader().destroy(e.getPublicId(), ObjectUtils.emptyMap());
            } catch (IOException | RuntimeException ex) {
                // If cleanup of Cloudinary fails, log and continue deleting DB record.
                System.err.println("Failed to delete Cloudinary image for evidence " + e.getId() + ": " + ex.getMessage());
            }
        });
        evidenceRepository.deleteAll(expired);
    }
}
