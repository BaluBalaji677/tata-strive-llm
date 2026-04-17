package com.example.demo.service;

import com.example.demo.controller.ProfileDTO;
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

    public ProfileService(UserRepository userRepository, StudentRepository studentRepository) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
    }

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }

        System.out.println("Fetching profile for: " + username);

        // For student, the principal username is the roll number. 
        // We can first try to find the student by roll number.
        return studentRepository.findByRollNumber(username)
                .map(Student::getUser)
                .orElseGet(() -> userRepository.findByUsername(username)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")));
    }

    public ProfileDTO getProfile() {
        User user = getAuthenticatedUser();
        ProfileDTO dto = new ProfileDTO();
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        dto.setProfileImageUrl(user.getProfileImageUrl());
        
        // If it's a student and user fullName is null, fallback to student fullName
        if (user.getRole() == User.Role.STUDENT && (user.getFullName() == null || user.getFullName().isBlank())) {
             Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
             String rollNo = principal instanceof UserDetails ? ((UserDetails) principal).getUsername() : principal.toString();
             studentRepository.findByRollNumber(rollNo).ifPresent(student -> {
                 dto.setFullName(student.getFullName());
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

        if (user.getRole() == User.Role.STUDENT) {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String rollNo = principal instanceof UserDetails ? ((UserDetails) principal).getUsername() : principal.toString();
            studentRepository.findByRollNumber(rollNo).ifPresent(student -> {
                student.setFullName(profileDTO.getFullName());
                studentRepository.save(student);
            });
        }

        return getProfile();
    }

    @Transactional
    public ProfileDTO uploadProfileImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(filename);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            User user = getAuthenticatedUser();
            String fileUrl = "/uploads/profile/" + filename;
            user.setProfileImageUrl(fileUrl);
            userRepository.save(user);

            return getProfile();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not upload file", e);
        }
    }
}
