package com.example.demo.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.example.demo.entity.QuizAssignment;
import com.example.demo.entity.Quiz;
import com.example.demo.entity.Student;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAssignmentRepository extends JpaRepository<QuizAssignment, Long> {
    boolean existsByQuizAndStudent(Quiz quiz, Student student);
    
    Optional<QuizAssignment> findByQuizAndStudent(Quiz quiz, Student student);

    List<QuizAssignment> findByStudent(Student student);

    @Query("SELECT qa FROM QuizAssignment qa WHERE qa.student = :student AND qa.quiz.createdBy.id = qa.student.course.teacher.id")
    List<QuizAssignment> findByStudentAndTeacherMatches(@Param("student") Student student);

    @Query("SELECT COUNT(qa) > 0 FROM QuizAssignment qa WHERE qa.quiz = :quiz AND qa.student = :student AND qa.quiz.createdBy.id = qa.student.course.teacher.id")
    boolean existsByQuizAndStudentAndTeacherMatches(@Param("quiz") Quiz quiz, @Param("student") Student student);

    Page<QuizAssignment> findByStudent_User_UsernameAndQuiz_ActiveTrue(String username, Pageable pageable);

    void deleteByQuiz(Quiz quiz);
}
