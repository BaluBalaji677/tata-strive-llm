package com.example.demo.service;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.demo.entity.CourseDay;
import com.example.demo.entity.Student;
import com.example.demo.entity.Submission;
import com.example.demo.entity.SubmissionStatus;
import com.example.demo.entity.User;
import com.example.demo.repository.SubmissionRepository;
import com.example.demo.repository.StudentRepository;

import jakarta.persistence.EntityManager;

@Service
public class SubmissionServiceImpl implements SubmissionService {

    private final SubmissionRepository submissionRepo;
    private final StudentRepository studentRepo;
    private final EntityManager entityManager;

    public SubmissionServiceImpl(
            SubmissionRepository submissionRepo,
            StudentRepository studentRepo,
            EntityManager entityManager
    ) {
        this.submissionRepo = submissionRepo;
        this.studentRepo = studentRepo;
        this.entityManager = entityManager;
    }

    @Override
    public Submission submitTask(Long courseDayId, String submissionText, String fileUrl, String githubLink) {
        if (courseDayId == null) {
            throw new RuntimeException("courseDayId is required");
        }
        if (isBlank(submissionText) && isBlank(githubLink) && isBlank(fileUrl)) {
            throw new RuntimeException("Provide submissionText or githubLink or fileUrl");
        }

        String username = getAuthenticatedName();

        Student student = studentRepo.findByUser_Username(username)
                .or(() -> studentRepo.findByRollNumber(username))
                .orElseThrow(() -> new RuntimeException("Student not found"));

        User user = student.getUser();
        if (user == null) {
            throw new RuntimeException("User not linked to student");
        }

        CourseDay courseDay = entityManager.find(CourseDay.class, courseDayId);
        if (courseDay == null) {
            throw new RuntimeException("CourseDay not found");
        }

        Submission submission = new Submission();
        submission.setStudent(student);
        submission.setCourseDay(courseDay);
        submission.setSubmissionText(isBlank(submissionText) ? null : submissionText);
        submission.setGithubLink(isBlank(githubLink) ? null : githubLink);
        submission.setFileUrl(isBlank(fileUrl) ? null : fileUrl);
        submission.setStatus(SubmissionStatus.PENDING);

        return submissionRepo.save(submission);
    }

    @Override
    public List<Submission> getMySubmissions() {
        String username = getAuthenticatedName();

        Student student = studentRepo.findByUser_Username(username)
                .or(() -> studentRepo.findByRollNumber(username))
                .orElseThrow(() -> new RuntimeException("Student not found"));

        return submissionRepo.findByStudentIdOrderBySubmittedAtDesc(student.getId());
    }

    @Override
    public List<Submission> getAllSubmissions() {
        return submissionRepo.findAll();
    }

    @Override
    public List<Submission> getSubmissionsByStudent(Long studentId) {
        if (studentId == null) {
            throw new RuntimeException("studentId is required");
        }
        return submissionRepo.findByStudentIdOrderBySubmittedAtDesc(studentId);
    }

    @Override
    public Submission updateStatus(Long submissionId, SubmissionStatus status) {
        if (submissionId == null) {
            throw new RuntimeException("submissionId is required");
        }
        if (status == null) {
            throw new RuntimeException("status is required");
        }
        if (status == SubmissionStatus.PENDING) {
            throw new RuntimeException("status must be APPROVED or REJECTED");
        }

        Submission submission = submissionRepo.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        submission.setStatus(status);

        return submissionRepo.save(submission);
    }

    @Override
    public Submission evaluate(Long submissionId, Integer marks, String feedback) {
        if (submissionId == null) {
            throw new RuntimeException("submissionId is required");
        }

        Submission submission = submissionRepo.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        submission.setMarks(marks);
        submission.setFeedback(isBlank(feedback) ? null : feedback);

        return submissionRepo.save(submission);
    }

    private String getAuthenticatedName() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new RuntimeException("Unauthorized");
        }
        return auth.getName();
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
