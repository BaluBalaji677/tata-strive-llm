package com.example.demo.controller;

import com.example.demo.dto.CourseDetailDTO;
import com.example.demo.dto.CourseSummaryDTO;
import com.example.demo.dto.TeacherOptionDTO;
import com.example.demo.entity.Course;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.CourseService;
import com.example.demo.service.TeacherAccessService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class CourseController {

    private final CourseService courseService;
    private final TeacherAccessService teacherAccessService;
    private final UserRepository userRepository;

    public CourseController(
            CourseService courseService,
            TeacherAccessService teacherAccessService,
            UserRepository userRepository
    ) {
        this.courseService = courseService;
        this.teacherAccessService = teacherAccessService;
        this.userRepository = userRepository;
    }

    @GetMapping("/courses")
    public List<CourseSummaryDTO> getAllCourses() {
        return courseService.getVisibleCourses();
    }

    @PostMapping("/courses")
    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL')")
    public CourseSummaryDTO create(@RequestBody CourseRequest request) {
        Course course = new Course();
        course.setTitle(resolveTitle(request.title(), request.name()));
        course.setDuration(resolveDuration(request.duration()));
        course.setDescription(request.description());
        course.setCreatedBy(request.createdBy());
        course.setTeacher(teacherAccessService.resolveTeacherForAssignment(request.teacherId()));
        return courseService.toSummaryDto(courseService.createCourse(course));
    }

    @PutMapping("/courses/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL')")
    public CourseSummaryDTO update(@PathVariable Long id, @RequestBody CourseRequest request) {
        Course updated = courseService.updateCourse(
                id,
                resolveTitle(request.title(), request.name()),
                request.description(),
                request.duration(),
                request.teacherId()
        );
        return courseService.toSummaryDto(updated);
    }

    @DeleteMapping("/courses/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL')")
    public void delete(@PathVariable Long id) {
        courseService.deleteCourse(id);
    }

    @GetMapping("/course/{id}")
    public CourseDetailDTO getCourseById(@PathVariable Long id) {
        return courseService.getVisibleCourseDetail(id);
    }

    @PostMapping("/admin/course")
    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL')")
    public CourseSummaryDTO createAdminCourse(@RequestBody AdminCourseRequest request) {
        Course course = new Course();
        course.setTitle(request.title());
        Integer duration = request.duration();
        if (duration == null) {
            duration = 0;
        }
        course.setDuration(duration);
        course.setDescription(request.description());
        course.setCreatedBy(request.createdBy());
        course.setTeacher(teacherAccessService.resolveTeacherForAssignment(request.teacherId()));
        return courseService.toSummaryDto(courseService.createCourse(course));
    }

    @PutMapping("/admin/course/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL')")
    public CourseDetailDTO updateAdminCourse(@PathVariable Long id, @RequestBody AdminCourseUpdateRequest request) {
        Course updated = courseService.updateCourse(id, request.title(), request.description(), request.duration(), request.teacherId());
        return courseService.toDetailDto(updated);
    }

    @DeleteMapping("/admin/course/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL')")
    public ResponseEntity<Map<String, String>> deleteAdminCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
    }

    @PostMapping("/api/admin/courses/{courseId}/assign-teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL')")
    public CourseSummaryDTO assignTeacher(@PathVariable Long courseId, @PathVariable Long teacherId) {
        return courseService.toSummaryDto(courseService.assignTeacher(courseId, teacherId));
    }

    @GetMapping("/admin/teachers")
    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL')")
    public List<TeacherOptionDTO> getTeacherOptions() {
        User currentUser = teacherAccessService.requireCurrentUser();
        List<User> teachers = userRepository.findByRole(Role.ADMIN, org.springframework.data.domain.Pageable.unpaged()).getContent();
        if (Role.ADMIN.equals(currentUser.getRole())) {
            teachers = teachers.stream()
                    .filter(teacher -> teacher.getId().equals(currentUser.getId()))
                    .toList();
        }
        return teachers.stream()
                .map(teacher -> new TeacherOptionDTO(
                        teacher.getId(),
                        teacher.getUsername(),
                        teacher.getFullName() != null && !teacher.getFullName().isBlank() ? teacher.getFullName() : teacher.getUsername()
                ))
                .toList();
    }

    public record CourseRequest(
            String title,
            String name,
            Integer duration,
            String description,
            String createdBy,
            Long teacherId
    ) {}

    public record AdminCourseRequest(
            String title,
            Integer duration,
            String description,
            String createdBy,
            Long teacherId
    ) {}

    public record AdminCourseUpdateRequest(
            String title,
            String description,
            Integer duration,
            Long teacherId
    ) {}

    private String resolveTitle(String title, String fallbackName) {
        String resolved = title;
        if (resolved == null || resolved.isBlank()) {
            resolved = fallbackName;
        }
        if (resolved == null || resolved.isBlank()) {
            throw new RuntimeException("title is required");
        }
        return resolved;
    }

    private Integer resolveDuration(Integer duration) {
        if (duration == null) {
            throw new RuntimeException("duration is required");
        }
        return duration;
    }
}
