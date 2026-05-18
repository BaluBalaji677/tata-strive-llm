package com.example.demo.controller;

import lombok.Data;

@Data
public class ProfileDTO {
    private Long id;
    private String rollNumber;
    private String fullName;
    private String email;
    private String role;
    private String profileImageUrl;
}
