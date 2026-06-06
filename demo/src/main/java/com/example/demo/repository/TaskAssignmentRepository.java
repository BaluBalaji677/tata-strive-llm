package com.example.demo.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.demo.entity.TaskAssignment;
import com.example.demo.entity.Student;
import com.example.demo.entity.LmsTask;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {

    boolean existsByTaskAndStudent(LmsTask task, Student student);

    List<TaskAssignment> findByStudentAndTask_ActiveTrueOrderByTask_DueDateAsc(Student student);

    Optional<TaskAssignment> findByIdAndStudent(Long id, Student student);

    @Query("SELECT ta FROM TaskAssignment ta WHERE ta.task.active = true " +
           "AND (:title IS NULL OR LOWER(ta.task.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
           "AND (:courseId IS NULL OR ta.task.course.id = :courseId) " +
           "AND (:studentId IS NULL OR ta.student.id = :studentId) " +
           "AND (:status IS NULL OR ta.status = :status) " +
           "AND (:dueDate IS NULL OR ta.task.dueDate = :dueDate) " +
           "AND (:createdById IS NULL OR ta.task.createdBy.id = :createdById)")
    Page<TaskAssignment> filterAssignments(
            @Param("title") String title,
            @Param("courseId") Long courseId,
            @Param("studentId") Long studentId,
            @Param("status") String status,
            @Param("dueDate") LocalDate dueDate,
            @Param("createdById") Long createdById,
            Pageable pageable
    );

    long countByTaskIdAndStatus(Long taskId, String status);

    long countByTaskId(Long taskId);
}
