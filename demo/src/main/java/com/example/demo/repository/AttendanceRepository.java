package com.example.demo.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.Attendance;
import com.example.demo.entity.Student;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByStudentOrderByDateAsc(Student student);

    long countByStudent(Student student);

    long countByStudentAndPresentTrue(Student student);

    Optional<Attendance> findByStudentAndDate(Student student, LocalDate date);

    long countByDate(LocalDate date);

    List<Attendance> findByStudent_Course_Teacher_UsernameOrderByDateAsc(String username);

    List<Attendance> findByStudent_Course_Teacher_UsernameAndStudent_RollNumberOrderByDateAsc(String username, String rollNumber);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Attendance a WHERE a.markedByUser = :user OR (a.markedByAdmin = true AND a.markedByUser IS NULL) ORDER BY a.date DESC")
    List<Attendance> findByMarkedByUserOrderByDateDesc(@org.springframework.data.repository.query.Param("user") com.example.demo.entity.User user);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Attendance a WHERE a.student = :student AND (a.markedByUser = :user OR (a.markedByAdmin = true AND a.markedByUser IS NULL)) ORDER BY a.date DESC")
    List<Attendance> findByStudentAndMarkedByUserOrderByDateDesc(@org.springframework.data.repository.query.Param("student") Student student, @org.springframework.data.repository.query.Param("user") com.example.demo.entity.User user);

    @Modifying
    @Transactional
    void deleteByStudent_Id(Long studentId);
}
