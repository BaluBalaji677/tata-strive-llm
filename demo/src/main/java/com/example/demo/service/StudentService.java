package com.example.demo.service;

import com.example.demo.entity.Student;

public interface StudentService {

    Student createStudent(String fullName, String username, String rollNumber, String status);

    Student updateStudent(Long id, String fullName, String username, String rollNumber, String status);

    void deleteStudent(Long id);

    int backfillMissingStudentUsers();
}