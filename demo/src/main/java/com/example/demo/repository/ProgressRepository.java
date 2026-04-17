package com.example.demo.repository;

import com.example.demo.entity.Progress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProgressRepository extends JpaRepository<Progress, Long> {

    Optional<Progress> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    List<Progress> findByStudentIdAndLesson_Module_Course_IdAndCompletedTrue(Long studentId, Long courseId);

    @Query("SELECT COUNT(l) FROM Lesson l WHERE l.module.course.id = :courseId")
    long countTotalLessonsByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT COUNT(p) FROM Progress p WHERE p.student.id = :studentId AND p.lesson.module.course.id = :courseId AND p.completed = true")
    long countCompletedLessonsByStudentAndCourse(@Param("studentId") Long studentId, @Param("courseId") Long courseId);
}
