package com.example.demo.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;

import com.example.demo.entity.Course;
import com.example.demo.entity.Module;
import com.example.demo.entity.Lesson;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.ModuleRepository;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.UserRepository;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Component
public class CourseDataLoader implements CommandLineRunner {

    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private ModuleRepository moduleRepository;
    
    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private UserRepository userRepository;

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

        normalizeLegacyTeacherAssignments();
        backfillLegacyAttendanceMarkedBy();
    }

    @Autowired
    private com.example.demo.repository.AttendanceRepository attendanceRepository;

    private void backfillLegacyAttendanceMarkedBy() {
        System.out.println("Checking for legacy attendance records to backfill...");
        List<com.example.demo.entity.Attendance> legacyRecords = attendanceRepository.findAll().stream()
                .filter(a -> a.isMarkedByAdmin() && a.getMarkedByUser() == null)
                .toList();

        if (legacyRecords.isEmpty()) {
            System.out.println("No legacy attendance records need backfilling.");
            return;
        }

        List<User> admins = userRepository.findByRole(Role.ADMIN, Pageable.unpaged()).getContent();
        User admin1 = admins.stream()
                .filter(admin -> "admin1".equalsIgnoreCase(admin.getUsername()))
                .findFirst()
                .orElse(admins.isEmpty() ? null : admins.get(0));

        int count = 0;
        for (com.example.demo.entity.Attendance a : legacyRecords) {
            com.example.demo.entity.Student student = a.getStudent();
            if (student != null && student.getCourse() != null && student.getCourse().getTeacher() != null) {
                a.setMarkedByUser(student.getCourse().getTeacher());
            } else if (admin1 != null) {
                a.setMarkedByUser(admin1);
            }
            if (a.getMarkedByUser() != null) {
                attendanceRepository.save(a);
                count++;
            }
        }

        System.out.printf("Successfully backfilled %d legacy attendance records with admin creator details.%n", count);
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

    private void normalizeLegacyTeacherAssignments() {
        List<Course> courses = courseRepository.findAll();
        List<User> admins = userRepository.findByRole(Role.ADMIN, Pageable.unpaged()).getContent();
        if (admins.isEmpty()) {
            return;
        }

        User admin1 = admins.stream()
                .filter(admin -> "admin1".equalsIgnoreCase(admin.getUsername()))
                .findFirst()
                .orElse(null);

        int updatedCount = 0;
        for (Course course : courses) {
            if (course.getTeacher() != null) {
                continue;
            }

            User matchedTeacher = findTeacherForLegacyCourse(course, admins).orElse(admin1);
            if (matchedTeacher == null && admins.size() == 1) {
                matchedTeacher = admins.get(0);
            }

            if (matchedTeacher != null) {
                course.setTeacher(matchedTeacher);
                courseRepository.save(course);
                updatedCount++;
                System.out.printf("Assigned legacy course '%s' to teacher %s%n", course.getTitle(), matchedTeacher.getUsername());
            }
        }

        if (updatedCount > 0) {
            System.out.printf("Normalized %d legacy course teacher assignments.%n", updatedCount);
        }
    }

    private Optional<User> findTeacherForLegacyCourse(Course course, List<User> admins) {
        String createdBy = normalize(course.getCreatedBy());
        if (createdBy == null) {
            return Optional.empty();
        }

        return admins.stream()
                .filter(admin -> createdBy.equals(normalize(admin.getUsername()))
                        || createdBy.equals(normalize(admin.getFullName()))
                        || createdBy.equals(normalize(admin.getEmail())))
                .findFirst();
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
