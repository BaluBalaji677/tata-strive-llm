package com.example.demo.service;

import com.example.demo.entity.Course;
import com.example.demo.entity.Role;
import com.example.demo.entity.Student;
import com.example.demo.entity.User;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TeacherAccessService {

    private static final Logger log = LoggerFactory.getLogger(TeacherAccessService.class);

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;

    public TeacherAccessService(
            UserRepository userRepository,
            CourseRepository courseRepository,
            StudentRepository studentRepository
    ) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.studentRepository = studentRepository;
    }

    public User requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        return userRepository.findByUsername(auth.getName())
                .or(() -> studentRepository.findByRollNumber(auth.getName()).map(Student::getUser))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    public boolean isPrincipal(User user) {
        return user != null && Role.PRINCIPAL.equals(user.getRole());
    }

    public boolean isTeacher(User user) {
        return user != null && Role.ADMIN.equals(user.getRole());
    }

    public Course requireCourseAccess(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        validateCourseAccess(course);
        return course;
    }

    public Course requireCourseTeacherManagement(Long courseId) {
        User currentUser = requireCurrentUser();
        if (!isPrincipal(currentUser) && !isTeacher(currentUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Teacher or principal access required");
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        validateCourseAccess(course);
        return course;
    }

    public Student requireStudentAccess(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        validateStudentAccess(student);
        return student;
    }

    public Student requireStudentAccessByRollNumber(String rollNumber) {
        Student student = studentRepository.findByRollNumber(rollNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        validateStudentAccess(student);
        return student;
    }

    public void validateCourseAccess(Course course) {
        User currentUser = requireCurrentUser();
        log.info("[AUTH CHECK] Validating course access for user: {}, role: {}, courseId: {}", 
                currentUser.getUsername(), currentUser.getRole(), course.getId());

        // 1. PRINCIPAL and ADMIN users can access any course
        if (Role.PRINCIPAL.equals(currentUser.getRole()) || "admin".equalsIgnoreCase(currentUser.getUsername())) {
            log.info("[AUTH SUCCESS] Principal/Admin {} granted access to course {}", currentUser.getUsername(), course.getId());
            return;
        }

        // 2. STUDENT users should be allowed if they are enrolled in the requested course
        if (Role.STUDENT.equals(currentUser.getRole())) {
            Student student = studentRepository.findByUser_Username(currentUser.getUsername())
                    .orElseThrow(() -> {
                        log.warn("[AUTH FAILURE] Student record not found for user: {}", currentUser.getUsername());
                        return new ResponseStatusException(HttpStatus.FORBIDDEN, "Student record not found");
                    });
            
            if (student.getCourse() == null || !student.getCourse().getId().equals(course.getId())) {
                log.warn("[AUTH FAILURE] Student {} not enrolled in course {}", currentUser.getUsername(), course.getId());
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not enrolled in this course");
            }
            log.info("[AUTH SUCCESS] Student {} is enrolled and granted access to course {}", currentUser.getUsername(), course.getId());
            return;
        }

        // 3. TEACHER users keep existing access behavior
        if (Role.ADMIN.equals(currentUser.getRole())) {
            Long assignedTeacherId = course.getTeacher() != null ? course.getTeacher().getId() : null;
            if (assignedTeacherId == null || !assignedTeacherId.equals(currentUser.getId())) {
                log.warn("[AUTH FAILURE] Teacher {} is not assigned to course {}", currentUser.getUsername(), course.getId());
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this course");
            }
            log.info("[AUTH SUCCESS] Teacher {} is assigned and granted access to course {}", currentUser.getUsername(), course.getId());
            return;
        }

        log.warn("[AUTH FAILURE] Access denied for user: {} with role: {}", currentUser.getUsername(), currentUser.getRole());
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    public void validateStudentAccess(Student student) {
        User currentUser = requireCurrentUser();
        if (isPrincipal(currentUser)) {
            return;
        }
        if (!isTeacher(currentUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Teacher access required");
        }
        Course course = student.getCourse();
        Long assignedTeacherId = course != null && course.getTeacher() != null ? course.getTeacher().getId() : null;
        if (assignedTeacherId == null || !assignedTeacherId.equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this student");
        }
    }

    public User resolveTeacherForAssignment(Long teacherId) {
        User currentUser = requireCurrentUser();
        if (teacherId == null) {
            if (isTeacher(currentUser)) {
                return currentUser;
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "teacherId is required");
        }

        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));
        if (!isTeacher(teacher)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected user is not a teacher");
        }

        if (isPrincipal(currentUser)) {
            return teacher;
        }
        if (isTeacher(currentUser) && currentUser.getId().equals(teacher.getId())) {
            return teacher;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only assign courses to yourself");
    }
}
