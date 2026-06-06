package com.example.demo.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.example.demo.entity.QuizSubmission;
import com.example.demo.entity.Quiz;
import com.example.demo.entity.Student;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizSubmissionRepository extends JpaRepository<QuizSubmission, Long> {
    boolean existsByQuizAndStudent(Quiz quiz, Student student);

    Optional<QuizSubmission> findFirstByQuizAndStudentOrderBySubmittedAtDesc(Quiz quiz, Student student);

    List<QuizSubmission> findByStudent(Student student);

    List<QuizSubmission> findByQuiz(Quiz quiz);

    Page<QuizSubmission> findByQuizId(Long quizId, Pageable pageable);

    @Query("SELECT qs FROM QuizSubmission qs WHERE " +
           "(:quizId IS NULL OR qs.quiz.id = :quizId) AND " +
           "(:studentId IS NULL OR qs.student.id = :studentId) AND " +
           "(:createdById IS NULL OR qs.quiz.createdBy.id = :createdById) " +
           "ORDER BY qs.submittedAt DESC")
    Page<QuizSubmission> findFilteredSubmissions(
            @Param("quizId") Long quizId,
            @Param("studentId") Long studentId,
            @Param("createdById") Long createdById,
            Pageable pageable
    );

    long countByQuiz(Quiz quiz);

    @Query("SELECT COALESCE(AVG(qs.score), 0.0) FROM QuizSubmission qs WHERE qs.quiz.id = :quizId")
    Double findAverageScoreByQuizId(Long quizId);

    @Query("SELECT MAX(qs.score) FROM QuizSubmission qs WHERE qs.quiz.id = :quizId")
    Integer findMaxScoreByQuizId(Long quizId);

    @Query("SELECT MIN(qs.score) FROM QuizSubmission qs WHERE qs.quiz.id = :quizId")
    Integer findMinScoreByQuizId(Long quizId);
}
