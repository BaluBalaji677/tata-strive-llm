package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.entity.LmsTask;
import java.util.List;

public interface LmsTaskRepository extends JpaRepository<LmsTask, Long> {
    List<LmsTask> findByActiveTrue();
}
