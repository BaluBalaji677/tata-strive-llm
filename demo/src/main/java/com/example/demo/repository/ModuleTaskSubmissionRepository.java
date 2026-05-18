package com.example.demo.repository;

import com.example.demo.entity.ModuleTaskSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModuleTaskSubmissionRepository extends JpaRepository<ModuleTaskSubmission, Long> {
    List<ModuleTaskSubmission> findByStudentId(Long studentId);
    List<ModuleTaskSubmission> findByStudentIdAndModuleTaskId(Long studentId, Long moduleTaskId);
    Optional<ModuleTaskSubmission> findTopByStudentIdAndModuleTaskIdOrderBySubmittedAtDesc(Long studentId, Long moduleTaskId);
    List<ModuleTaskSubmission> findByModuleTaskId(Long moduleTaskId);
    long countByModuleTaskId(Long moduleTaskId);
}
