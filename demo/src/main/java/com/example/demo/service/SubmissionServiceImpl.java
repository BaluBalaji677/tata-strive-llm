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
import com.example.demo.repository.UserRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;

@Service
public class SubmissionServiceImpl implements SubmissionService {

    private final SubmissionRepository submissionRepo;
    private final UserRepository userRepo;
    private final StudentRepository studentRepo;
    private final EntityManager entityManager;

    public SubmissionServiceImpl(
            SubmissionRepository submissionRepo,
            UserRepository userRepo,
            StudentRepository studentRepo,
            EntityManager entityManager
    ) {
        this.submissionRepo = submissionRepo;
        this.userRepo = userRepo;
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

        // Student identity = rollNumber (JWT subject / auth.getName()).
        String rollNumber = username;
        Student student = studentRepo.findByRollNumber(rollNumber)
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

        String rollNumber = username;
        Student student = studentRepo.findByRollNumber(rollNumber)
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

    private Student findStudentByUser(User user) {
        TypedQuery<Student> q = entityManager.createQuery(
                "select s from Student s where s.user = :user",
                Student.class
        );
        q.setParameter("user", user);

        List<Student> results = q.setMaxResults(1).getResultList();
        if (results.isEmpty()) {
            throw new RuntimeException("Student not found for this user");
        }
        return results.get(0);
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

