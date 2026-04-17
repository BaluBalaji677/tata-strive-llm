package com.example.demo.controller;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.Course;
import com.example.demo.repository.CourseRepository;

@RestController
public class CourseController {

    private final CourseRepository courseRepository;

    public CourseController(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @GetMapping("/courses")
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @PostMapping("/courses")
    @PreAuthorize("hasRole('ADMIN')")
    public Course create(@RequestBody CourseRequest request) {
        Course course = new Course();
        course.setTitle(resolveTitle(request));
        course.setDuration(resolveDuration(request));
        return courseRepository.save(course);
    }

    @PutMapping("/courses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Course update(@PathVariable Long id, @RequestBody CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        course.setTitle(resolveTitle(request));
        course.setDuration(resolveDuration(request));
        return courseRepository.save(course);
    }

    @DeleteMapping("/courses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        courseRepository.deleteById(id);
    }

    private String resolveTitle(CourseRequest request) {
        String title = request.title();
        if (title == null || title.isBlank()) {
            title = request.name(); // frontend sends `name`
        }
        if (title == null || title.isBlank()) {
            throw new RuntimeException("title is required");
        }
        return title;
    }

    private Integer resolveDuration(CourseRequest request) {
        Integer duration = request.duration();
        if (duration == null) {
            throw new RuntimeException("duration is required");
        }
        return duration;
    }

    public record CourseRequest(
            String title,
            String name,
            Integer duration
    ) {}
    @org.springframework.beans.factory.annotation.Autowired
    private com.example.demo.service.CourseService courseService;

    @GetMapping("/course/{id}")
    public Course getCourseById(@PathVariable Long id) {
        return courseService.getCourseById(id);
    }

    @PostMapping("/admin/course")
    @PreAuthorize("hasRole('ADMIN')")
    public Course createAdminCourse(@RequestBody AdminCourseRequest request) {
        Course course = new Course();
        course.setTitle(request.title());
        course.setDuration(request.duration() != null ? request.duration() : 0);
        course.setDescription(request.description());
        course.setCreatedBy(request.createdBy());
        return courseService.createCourse(course);
    }

    public record AdminCourseRequest(
            String title,
            Integer duration,
            String description,
            String createdBy
    ) {}

    @PutMapping("/admin/course/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Course updateAdminCourse(@PathVariable Long id, @RequestBody AdminCourseUpdateRequest request) {
        return courseService.updateCourse(id, request.title(), request.description(), request.duration());
    }

    @DeleteMapping("/admin/course/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteAdminCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
    }

    public record AdminCourseUpdateRequest(
            String title,
            String description,
            Integer duration
    ) {}
}

