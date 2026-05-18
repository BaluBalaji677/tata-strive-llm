package com.example.demo.dto;

import java.time.LocalDateTime;

import com.example.demo.entity.CourseCertificate;

public record CourseCertificateDTO(
        Long id,
        Long courseId,
        String certificateName,
        String certificateUrl,
        LocalDateTime uploadedAt
) {
    public static CourseCertificateDTO fromEntity(CourseCertificate certificate) {
        if (certificate == null) {
            return null;
        }

        return new CourseCertificateDTO(
                certificate.getId(),
                certificate.getCourseId(),
                certificate.getCertificateName(),
                certificate.getCertificateUrl(),
                certificate.getUploadedAt()
        );
    }
}
