package com.example.demo.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.AttendanceEvidence;

public interface AttendanceEvidenceRepository extends JpaRepository<AttendanceEvidence, Long> {

    List<AttendanceEvidence> findByExpiresAtAfterOrderByCapturedAtDesc(LocalDateTime time);

    List<AttendanceEvidence> findByTeacher_IdAndExpiresAtAfterOrderByCapturedAtDesc(Long teacherId, LocalDateTime time);

    List<AttendanceEvidence> findByExpiresAtBefore(LocalDateTime time);
}