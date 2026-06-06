package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.demo.entity.QuizAnswer;
import com.example.demo.entity.QuizSubmission;
import java.util.List;

@Repository
public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, Long> {
    List<QuizAnswer> findBySubmission(QuizSubmission submission);
    List<QuizAnswer> findBySubmissionId(Long submissionId);
}
