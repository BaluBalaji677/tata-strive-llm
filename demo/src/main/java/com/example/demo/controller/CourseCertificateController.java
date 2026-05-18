package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.CourseCertificateDTO;
import com.example.demo.service.CourseCertificateService;

@RestController
@RequestMapping("/api")
public class CourseCertificateController {

    private final CourseCertificateService courseCertificateService;

    public CourseCertificateController(CourseCertificateService courseCertificateService) {
        this.courseCertificateService = courseCertificateService;
    }

    @PostMapping(path = "/admin/courses/{courseId}/certificate/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL')")
    public ResponseEntity<CourseCertificateDTO> uploadCertificate(@PathVariable Long courseId,
                                                                  @RequestParam("certificateName") String certificateName,
                                                                  @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(courseCertificateService.uploadCertificate(courseId, certificateName, file));
    }

    @GetMapping("/courses/{courseId}/certificate")
    public ResponseEntity<CourseCertificateDTO> getCertificate(@PathVariable Long courseId,
                                                               Authentication authentication) {
        return ResponseEntity.ok(courseCertificateService.getCertificateForCourse(courseId, authentication));
    }
}
