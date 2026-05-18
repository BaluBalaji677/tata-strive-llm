package com.example.demo.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.CourseCertificateDTO;
import com.example.demo.entity.CourseCertificate;
import com.example.demo.entity.Role;
import com.example.demo.entity.Student;
import com.example.demo.entity.User;
import com.example.demo.repository.CourseCertificateRepository;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;

@Service
public class CourseCertificateService {

    private static final Logger log = LoggerFactory.getLogger(CourseCertificateService.class);
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".pdf", ".png", ".jpg", ".jpeg", ".webp");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/webp"
    );

    private final CourseCertificateRepository courseCertificateRepository;
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final ModuleTaskService moduleTaskService;

    @Value("${app.certificate.upload.dir:uploads/certificates}")
    private String certificateUploadDir;

    public CourseCertificateService(CourseCertificateRepository courseCertificateRepository,
                                    CourseRepository courseRepository,
                                    StudentRepository studentRepository,
                                    UserRepository userRepository,
                                    ModuleTaskService moduleTaskService) {
        this.courseCertificateRepository = courseCertificateRepository;
        this.courseRepository = courseRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.moduleTaskService = moduleTaskService;
    }

    @Transactional
    public CourseCertificateDTO uploadCertificate(Long courseId, String certificateName, MultipartFile file) {
        if (courseId == null || !courseRepository.existsById(courseId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
        if (certificateName == null || certificateName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Certificate name is required");
        }
        validateFile(file);

        try {
            Path uploadPath = Paths.get(certificateUploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String extension = extractExtension(file.getOriginalFilename());
            String filename = "course-" + courseId + "-" + UUID.randomUUID() + extension;
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            CourseCertificate certificate = courseCertificateRepository.findByCourseId(courseId)
                    .orElseGet(CourseCertificate::new);
            certificate.setCourseId(courseId);
            certificate.setCertificateName(certificateName.trim());
            certificate.setCertificateUrl("/uploads/certificates/" + filename);

            CourseCertificate saved = courseCertificateRepository.save(certificate);
            log.info("Uploaded course certificate for courseId={} url={}", courseId, saved.getCertificateUrl());
            return CourseCertificateDTO.fromEntity(saved);
        } catch (IOException ex) {
            log.error("Failed to upload certificate for courseId={}", courseId, ex);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not upload certificate", ex);
        }
    }

    @Transactional(readOnly = true)
    public CourseCertificateDTO getCertificateForCourse(Long courseId, Authentication authentication) {
        CourseCertificate certificate = courseCertificateRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate not found"));

        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }

        User user = resolveAuthenticatedUser(authentication.getName());
        if (user.getRole() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User role is missing");
        }

        if (Role.STUDENT.equals(user.getRole())) {
            Student student = resolveStudent(authentication.getName());
            String status = moduleTaskService.calculateCourseResult(student.getId(), courseId).getStatus();
            if (!"PASS".equalsIgnoreCase(status)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Certificate is available only after course completion");
            }
        }

        return CourseCertificateDTO.fromEntity(certificate);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Certificate file is required");
        }

        String extension = extractExtension(file.getOriginalFilename());
        String contentType = file.getContentType();
        if (!ALLOWED_EXTENSIONS.contains(extension) || (contentType != null && !ALLOWED_CONTENT_TYPES.contains(contentType))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PDF and image certificates are supported");
        }
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file must have an extension");
        }
        return filename.substring(filename.lastIndexOf(".")).toLowerCase(Locale.ROOT);
    }

    private User resolveAuthenticatedUser(String principalName) {
        Student student = studentRepository.findByRollNumber(principalName).orElse(null);
        if (student != null && student.getUser() != null) {
            return student.getUser();
        }

        return userRepository.findByUsername(principalName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));
    }

    private Student resolveStudent(String principalName) {
        return studentRepository.findByRollNumber(principalName)
                .or(() -> studentRepository.findByUser_Username(principalName))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
    }
}
