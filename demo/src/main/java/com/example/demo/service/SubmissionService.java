package com.example.demo.service;

import java.util.List;

import com.example.demo.entity.Submission;
import com.example.demo.entity.SubmissionStatus;

public interface SubmissionService {

    // Student
    Submission submitTask(Long courseDayId, String submissionText, String fileUrl, String githubLink);

    List<Submission> getMySubmissions();

    // Admin
    List<Submission> getAllSubmissions();

    List<Submission> getSubmissionsByStudent(Long studentId);

    Submission updateStatus(Long submissionId, SubmissionStatus status);

    Submission evaluate(Long submissionId, Integer marks, String feedback);
}

