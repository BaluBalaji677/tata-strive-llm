package com.example.demo.service;

import org.springframework.stereotype.Service;
import com.example.demo.entity.Course;
import com.example.demo.repository.CourseRepository;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class CourseService {

    private static final Logger log = LoggerFactory.getLogger(CourseService.class);

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
    }

    @Transactional
    public Course updateCourse(Long id, String title, String description, Integer duration) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));
        
        if (title != null) course.setTitle(title);
        if (description != null) course.setDescription(description);
        if (duration != null) course.setDuration(duration);
        
        Course updatedCourse = courseRepository.save(course);
        log.info("Updated course: {}", id);
        return updatedCourse;
    }

    @Transactional
    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new RuntimeException("Course not found with id: " + id);
        }
        courseRepository.deleteById(id);
        log.info("Deleted course with id: {}", id);
    }
}
