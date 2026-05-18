package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.FaceData;
import com.example.demo.entity.Student;

public interface FaceDataRepository extends JpaRepository<FaceData, Long> {

    Optional<FaceData> findByStudent(Student student);
}
