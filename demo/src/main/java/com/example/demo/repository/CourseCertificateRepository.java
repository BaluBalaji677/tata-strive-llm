package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.CourseCertificate;

public interface CourseCertificateRepository extends JpaRepository<CourseCertificate, Long> {
    Optional<CourseCertificate> findByCourseId(Long courseId);
}
