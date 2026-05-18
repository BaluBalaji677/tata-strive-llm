package com.example.demo.service;

import com.example.demo.controller.ProfileDTO;
import com.example.demo.entity.Role;
import com.example.demo.entity.Student;
import com.example.demo.entity.User;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;

    @Value("${app.upload.dir:uploads/profile}")
    private String uploadDir;

    public ProfileService(UserRepository userRepository,
                          StudentRepository studentRepository) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
    }

    private User getAuthenticatedUser() {

        Object principal = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        String username;

        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }

        return studentRepository.findByRollNumber(username)
                .map(Student::getUser)
                .orElseGet(() ->
                        userRepository.findByUsername(username)
                                .orElseThrow(() ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "User not found"
                                        )
                                )
                );
    }

    public ProfileDTO getProfile() {

        User user = getAuthenticatedUser();

        ProfileDTO dto = new ProfileDTO();

        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());

        if (user.getRole() != null) {
            dto.setRole(user.getRole().name());
        }

        dto.setProfileImageUrl(user.getProfileImageUrl());

        // Student extra fields
        if (user.getRole() == Role.STUDENT) {

            Object principal = SecurityContextHolder
                    .getContext()
                    .getAuthentication()
                    .getPrincipal();

            String rollNo;

            if (principal instanceof UserDetails) {
                rollNo = ((UserDetails) principal).getUsername();
            } else {
                rollNo = principal.toString();
            }

            studentRepository.findByRollNumber(rollNo)
                    .ifPresent(student -> {

                        dto.setId(student.getId());
                        dto.setRollNumber(student.getRollNumber());

                        if (user.getFullName() == null ||
                                user.getFullName().isBlank()) {

                            dto.setFullName(student.getFullName());
                        }
                    });
        }

        return dto;
    }

    @Transactional
    public ProfileDTO updateProfile(ProfileDTO profileDTO) {

        User user = getAuthenticatedUser();

        user.setFullName(profileDTO.getFullName());
        user.setEmail(profileDTO.getEmail());

        userRepository.save(user);

        if (user.getRole() == Role.STUDENT) {

            Object principal = SecurityContextHolder
                    .getContext()
                    .getAuthentication()
                    .getPrincipal();

            String rollNo;

            if (principal instanceof UserDetails) {
                rollNo = ((UserDetails) principal).getUsername();
            } else {
                rollNo = principal.toString();
            }

            studentRepository.findByRollNumber(rollNo)
                    .ifPresent(student -> {

                        student.setFullName(profileDTO.getFullName());

                        studentRepository.save(student);
                    });
        }

        return getProfile();
    }

    @Transactional
    public ProfileDTO uploadProfileImage(MultipartFile file) {

        if (file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "File is empty"
            );
        }

        try {

            Path uploadPath = Paths.get(uploadDir);

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();

            String extension = "";

            if (originalFilename != null &&
                    originalFilename.contains(".")) {

                extension = originalFilename.substring(
                        originalFilename.lastIndexOf(".")
                );
            }

            String filename = UUID.randomUUID() + extension;

            Path filePath = uploadPath.resolve(filename);

            Files.copy(
                    file.getInputStream(),
                    filePath,
                    StandardCopyOption.REPLACE_EXISTING
            );

            User user = getAuthenticatedUser();

            String fileUrl = "/uploads/profile/" + filename;

            user.setProfileImageUrl(fileUrl);

            userRepository.save(user);

            return getProfile();

        } catch (IOException e) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not upload file",
                    e
            );
        }
    }
}