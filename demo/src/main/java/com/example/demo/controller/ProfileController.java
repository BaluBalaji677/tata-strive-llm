package com.example.demo.controller;

import com.example.demo.service.ProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<ProfileDTO> getProfile() {
        return ResponseEntity.ok(profileService.getProfile());
    }

    @PutMapping
    public ResponseEntity<ProfileDTO> updateProfile(@RequestBody ProfileDTO profileDTO) {
        return ResponseEntity.ok(profileService.updateProfile(profileDTO));
    }

    @PostMapping("/upload-image")
    public ResponseEntity<ProfileDTO> uploadImage(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(profileService.uploadProfileImage(file));
    }
}
