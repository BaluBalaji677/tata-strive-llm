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

    @Modifying
    @Transactional
    void deleteByStudent_Id(Long studentId);
}

