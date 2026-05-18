package com.example.demo.repository;

import com.example.demo.entity.ModuleTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModuleTaskRepository extends JpaRepository<ModuleTask, Long> {
    List<ModuleTask> findByModuleIdOrderByIdAsc(Long moduleId);
    List<ModuleTask> findByModule_Course_Id(Long courseId);
}
