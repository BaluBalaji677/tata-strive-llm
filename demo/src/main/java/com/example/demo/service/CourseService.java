package com.example.demo.service;

import com.example.demo.dto.CourseDetailDTO;
import com.example.demo.dto.CourseSummaryDTO;
import com.example.demo.dto.LessonDetailDTO;
import com.example.demo.dto.ModuleDetailDTO;
import org.springframework.stereotype.Service;
import com.example.demo.entity.Course;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.StudentRepository;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class CourseService {

    private static final Logger log = LoggerFactory.getLogger(CourseService.class);

    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;
    private final TeacherAccessService teacherAccessService;

    public CourseService(
            CourseRepository courseRepository,
            StudentRepository studentRepository,
            TeacherAccessService teacherAccessService
    ) {
        this.courseRepository = courseRepository;
        this.studentRepository = studentRepository;
        this.teacherAccessService = teacherAccessService;
    }

    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    public List<CourseSummaryDTO> getVisibleCourses() {
        User currentUser = teacherAccessService.requireCurrentUser();
        List<Course> courses;
        if (Role.ADMIN.equals(currentUser.getRole())) {
            courses = courseRepository.findByTeacher_Username(currentUser.getUsername());
        } else if (Role.STUDENT.equals(currentUser.getRole())) {
            courses = studentRepository.findByUser_Username(currentUser.getUsername())
                    .map(student -> student.getCourse() == null ? List.<Course>of() : List.of(student.getCourse()))
                    .orElse(List.of());
        } else {
            courses = courseRepository.findAll();
        }

        return courses.stream()
                .map(this::toSummaryDto)
                .toList();
    }

    public CourseDetailDTO getVisibleCourseDetail(Long id) {
        Course course = teacherAccessService.requireCourseAccess(id);
        return toDetailDto(course);
    }

    @Transactional
    public Course updateCourse(Long id, String title, String description, Integer duration, Long teacherId) {
        Course course = teacherAccessService.requireCourseTeacherManagement(id);
        
        if (title != null) course.setTitle(title);
        if (description != null) course.setDescription(description);
        if (duration != null) course.setDuration(duration);
        if (teacherId != null || course.getTeacher() == null) {
            course.setTeacher(teacherAccessService.resolveTeacherForAssignment(teacherId));
        }
        
        Course updatedCourse = courseRepository.save(course);
        log.info("Updated course: {}", id);
        return updatedCourse;
    }

    @Transactional
    public void deleteCourse(Long id) {
        teacherAccessService.requireCourseTeacherManagement(id);
        courseRepository.deleteById(id);
        log.info("Deleted course with id: {}", id);
    }

    @Transactional
    public Course assignTeacher(Long courseId, Long teacherId) {
        Course course = teacherAccessService.requireCourseTeacherManagement(courseId);
        course.setTeacher(teacherAccessService.resolveTeacherForAssignment(teacherId));
        return courseRepository.save(course);
    }

    public CourseSummaryDTO toSummaryDto(Course course) {
        long assignedStudentsCount = studentRepository.findAll().stream()
                .filter(student -> student.getCourse() != null && student.getCourse().getId().equals(course.getId()))
                .count();
        return new CourseSummaryDTO(
                course.getId(),
                course.getTitle(),
                course.getDuration(),
                course.getDescription(),
                course.getCreatedBy(),
                course.getTeacher() != null ? course.getTeacher().getId() : null,
                course.getTeacher() != null ? firstNonBlank(course.getTeacher().getFullName(), course.getTeacher().getUsername()) : null,
                assignedStudentsCount
        );
    }

    public CourseDetailDTO toDetailDto(Course course) {
        return new CourseDetailDTO(
                course.getId(),
                course.getTitle(),
                course.getDuration(),
                course.getDescription(),
                course.getCreatedBy(),
                course.getTeacher() != null ? course.getTeacher().getId() : null,
                course.getTeacher() != null ? firstNonBlank(course.getTeacher().getFullName(), course.getTeacher().getUsername()) : null,
                studentRepository.findAll().stream()
                        .filter(student -> student.getCourse() != null && student.getCourse().getId().equals(course.getId()))
                        .count(),
                course.getModules() == null
                        ? List.of()
                        : course.getModules().stream()
                        .map(module -> new ModuleDetailDTO(
                                module.getId(),
                                module.getTitle(),
                                module.getLessons() == null
                                        ? List.of()
                                        : module.getLessons().stream()
                                        .map(lesson -> new LessonDetailDTO(
                                                lesson.getId(),
                                                lesson.getTitle(),
                                                lesson.getContent(),
                                                lesson.getOrderIndex()
                                        ))
                                        .toList()
                        ))
                        .toList()
        );
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
