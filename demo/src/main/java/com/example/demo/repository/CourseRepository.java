package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;

import com.example.demo.entity.Course;

public interface CourseRepository extends JpaRepository<Course, Long> {

    @Override
    @EntityGraph(attributePaths = {"teacher"})
    @NonNull
    List<Course> findAll();

    @Override
    @EntityGraph(attributePaths = {"modules", "modules.lessons", "teacher"})
    @NonNull
    java.util.Optional<Course> findById(@NonNull Long id);

    @EntityGraph(attributePaths = {"teacher"})
    List<Course> findByTeacher_Username(String username);

    long countByTeacher_Username(String username);
}

