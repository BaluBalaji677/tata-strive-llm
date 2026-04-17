package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.Submission;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    List<Submission> findByStudentIdOrderBySubmittedAtDesc(Long studentId);
}

