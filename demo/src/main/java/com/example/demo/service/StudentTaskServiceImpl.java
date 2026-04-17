package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.entity.CourseDay;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;

@Service
public class StudentTaskServiceImpl implements StudentTaskService {

    private final EntityManager entityManager;

    public StudentTaskServiceImpl(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public List<CourseDay> getAllTasks() {
        TypedQuery<CourseDay> q = entityManager.createQuery(
                "select cd from CourseDay cd order by cd.dayNumber asc",
                CourseDay.class
        );
        return q.getResultList();
    }
}

