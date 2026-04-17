package com.example.demo.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.example.demo.entity.Student;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByRollNumber(String rollNumber);

    Optional<Student> findByUser_Username(String username);

    @Query("SELECT s FROM Student s LEFT JOIN FETCH s.user")
    List<Student> findAllWithUser();

    List<Student> findByUserIsNull();
}