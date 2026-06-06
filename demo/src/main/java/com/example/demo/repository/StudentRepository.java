package com.example.demo.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;

import com.example.demo.entity.Student;

public interface StudentRepository extends JpaRepository<Student, Long> {
    @EntityGraph(attributePaths = {"user", "course", "course.teacher"})
    Optional<Student> findByRollNumber(String rollNumber);

    @EntityGraph(attributePaths = {"user", "course", "course.teacher"})
    @Query("""
            SELECT s
            FROM Student s
            WHERE s.rollNumber = :rollNumber
              AND s.course.teacher.id = :adminId
            """)
    Optional<Student> findByRollNumberAndAdminId(
            @Param("rollNumber") String rollNumber,
            @Param("adminId") Long adminId
    );

    @Query("""
            SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END
            FROM Student s
            WHERE s.rollNumber = :rollNumber
              AND s.course.teacher.id = :adminId
            """)
    boolean existsByRollNumberAndAdminId(
            @Param("rollNumber") String rollNumber,
            @Param("adminId") Long adminId
    );

    @EntityGraph(attributePaths = {"user", "course", "course.teacher"})
    Optional<Student> findByUser_Username(String username);

    @EntityGraph(attributePaths = {"user", "course", "course.teacher"})
    Optional<Student> findByUser_Email(String email);

    @Query("SELECT s FROM Student s LEFT JOIN FETCH s.user")
    List<Student> findAllWithUser();

    List<Student> findByUserIsNull();

    @Override
    @EntityGraph(attributePaths = {"user", "course", "course.teacher"})
    @NonNull
    Page<Student> findAll(@NonNull Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"user", "course", "course.teacher"})
    @NonNull
    List<Student> findAll();

    @EntityGraph(attributePaths = {"user", "course", "course.teacher"})
    List<Student> findByCourse_Teacher_Username(String username);

    @EntityGraph(attributePaths = {"user", "course", "course.teacher"})
    List<Student> findByCourse_Teacher_Id(Long teacherId);

    @EntityGraph(attributePaths = {"user", "course", "course.teacher"})
    Page<Student> findByCourse_Teacher_Id(Long teacherId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "course", "course.teacher"})
    Optional<Student> findByRollNumberAndCourse_Teacher_Username(String rollNumber, String username);

    long countByCourse_Teacher_Username(String username);

    // Find students with null course (orphaned)
    @Query("SELECT s FROM Student s WHERE s.course IS NULL")
    @EntityGraph(attributePaths = {"user"})
    List<Student> findStudentsWithoutCourse();

    // Find students whose course has no teacher assigned (orphaned courses)
    @Query("SELECT s FROM Student s WHERE s.course.teacher IS NULL")
    @EntityGraph(attributePaths = {"user", "course"})
    List<Student> findStudentsWithoutTeacher();
}
