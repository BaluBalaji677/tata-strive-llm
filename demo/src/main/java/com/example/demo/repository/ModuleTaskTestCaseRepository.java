package com.example.demo.repository;

import com.example.demo.entity.ModuleTaskTestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModuleTaskTestCaseRepository extends JpaRepository<ModuleTaskTestCase, Long> {
    List<ModuleTaskTestCase> findByModuleTaskId(Long moduleTaskId);
}
