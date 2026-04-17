package com.example.demo.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.demo.entity.Course;
import com.example.demo.entity.Module;
import com.example.demo.entity.Lesson;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.ModuleRepository;
import com.example.demo.repository.LessonRepository;

@Component
public class CourseDataLoader implements CommandLineRunner {

    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private ModuleRepository moduleRepository;
    
    @Autowired
    private LessonRepository lessonRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (courseRepository.count() == 0) {
            System.out.println("Seeding default Java Full Stack course...");
            
            Course course = new Course();
            course.setTitle("Java Full Stack");
            course.setDuration(120);
            course.setDescription("Complete Java Full Stack Course covering Java, Spring Boot, and React.");
            course.setCreatedBy("Admin");
            course = courseRepository.save(course);

            // Module 1: Java Basics
            Module module1 = createModule("Java Basics", course);
            createLesson("Variables", "<h2>Variables</h2><p>Variables store data...</p><pre>int x = 10;</pre>", 1, module1);
            createLesson("Data Types", "<h2>Data Types</h2><p>Java has primitive and reference data types.</p>", 2, module1);

            // Module 2: OOP
            Module module2 = createModule("OOP", course);
            createLesson("Classes and Objects", "<h2>Classes and Objects</h2><p>Classes are blueprints for objects.</p>", 1, module2);
            createLesson("Inheritance", "<h2>Inheritance</h2><p>Provides code reusability using the extends keyword.</p>", 2, module2);

            // Module 3: Advanced Java
            Module module3 = createModule("Advanced Java", course);
            createLesson("Collections Framework", "<h2>Collections Framework</h2><p>List, Set, Map interfaces and implementations.</p>", 1, module3);
            createLesson("Java 8 Streams", "<h2>Streams API</h2><p>Functional-style operations on streams of elements.</p>", 2, module3);

            // Module 4: MySQL
            Module module4 = createModule("MySQL", course);
            createLesson("Basic Queries", "<h2>Basic Queries</h2><p>SELECT, INSERT, UPDATE, DELETE statements.</p>", 1, module4);
            createLesson("Joins", "<h2>Joins</h2><p>INNER JOIN, LEFT JOIN, RIGHT JOIN.</p>", 2, module4);

            // Module 5: Spring Boot
            Module module5 = createModule("Spring Boot", course);
            createLesson("Introduction to Spring Boot", "<h2>Spring Boot Intro</h2><p>Auto-configuration and embedded servers.</p>", 1, module5);
            createLesson("REST APIs", "<h2>REST APIs</h2><p>Building controllers with @RestController.</p>", 2, module5);

            // Module 6: React
            Module module6 = createModule("React", course);
            createLesson("Components", "<h2>Components</h2><p>Functional and Class components in React.</p>", 1, module6);
            createLesson("Hooks", "<h2>Hooks</h2><p>useState, useEffect, and custom hooks.</p>", 2, module6);

            System.out.println("Default course seeded successfully.");
        } else {
            System.out.println("Course data exists. Skipping default seed.");
        }
    }

    private Module createModule(String title, Course course) {
        Module module = new Module();
        module.setTitle(title);
        module.setCourse(course);
        return moduleRepository.save(module);
    }

    private Lesson createLesson(String title, String content, int orderIndex, Module module) {
        Lesson lesson = new Lesson();
        lesson.setTitle(title);
        lesson.setContent(content);
        lesson.setOrderIndex(orderIndex);
        lesson.setModule(module);
        return lessonRepository.save(lesson);
    }
}
