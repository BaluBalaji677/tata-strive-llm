package com.example.demo.service;

import java.util.List;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.entity.Course;
import com.example.demo.entity.Role;
import com.example.demo.entity.Student;
import com.example.demo.entity.User;
import com.example.demo.repository.AttendanceRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;

@Service
public class StudentServiceImpl implements StudentService {

    @Value("${app.default-student-password:student123}")
    private String defaultStudentPassword;

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final AttendanceRepository attendanceRepository;
    private final PasswordEncoder passwordEncoder;
    private final TeacherAccessService teacherAccessService;

    public StudentServiceImpl(
            StudentRepository studentRepository,
            UserRepository userRepository,
            AttendanceRepository attendanceRepository,
            PasswordEncoder passwordEncoder,
            TeacherAccessService teacherAccessService
    ) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.attendanceRepository = attendanceRepository;
        this.passwordEncoder = passwordEncoder;
        this.teacherAccessService = teacherAccessService;
    }

    @Override
    @Transactional
    public Student createStudent(
            String fullName,
            String username,
            String rollNumber,
            String status,
            Long courseId
    ) {

        String normalizedRollNumber =
                normalizeRequired(rollNumber, "rollNumber");

        Course course =
                teacherAccessService.requireCourseTeacherManagement(courseId);

        Long adminId = resolveAdminId(course);

        if (studentRepository.existsByRollNumberAndAdminId(normalizedRollNumber, adminId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Roll number already exists for this admin"
            );
        }

        String normalizedEmail =
                normalizeRequired(username, "email");

        if (userRepository.findByUsername(normalizedEmail).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "email already exists"
            );
        }

        User user = new User();

        user.setUsername(normalizedEmail);

        user.setPasswordHash(
                passwordEncoder.encode(defaultStudentPassword)
        );

        user.setRole(Role.STUDENT);

        user = userRepository.save(user);

        Student student = new Student();

        student.setRollNumber(normalizedRollNumber);

        student.setFullName(
                normalizeRequired(fullName, "fullName")
        );

        student.setStatus(resolveStatus(status));

        student.setUser(user);
        student.setCourse(course);

        return studentRepository.save(student);
    }

    @Override
    @Transactional
    public Student updateStudent(
            Long id,
            String fullName,
            String username,
            String rollNumber,
            String status,
            Long courseId
    ) {

        Student student = teacherAccessService.requireStudentAccess(id);

        Course targetCourse = student.getCourse();
        if (courseId != null) {
            targetCourse = teacherAccessService.requireCourseTeacherManagement(courseId);
        }

        String targetRollNumber = student.getRollNumber();
        if (rollNumber != null) {
            targetRollNumber = normalizeRequired(rollNumber, "rollNumber");
        }

        if (rollNumber != null || courseId != null) {
            if (targetCourse == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "courseId is required"
                );
            }

            Long adminId = resolveAdminId(targetCourse);

            studentRepository.findByRollNumberAndAdminId(targetRollNumber, adminId)
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new ResponseStatusException(
                                    HttpStatus.CONFLICT,
                                    "Roll number already exists for this admin"
                            );
                        }
                    });
        }

        if (rollNumber != null) {
            student.setRollNumber(targetRollNumber);
        }

        if (fullName != null) {
            student.setFullName(normalizeRequired(fullName, "fullName"));
        }

        if (status != null) {
            student.setStatus(resolveStatus(status));
        }

        if (courseId != null) {
            student.setCourse(targetCourse);
        }
        
        return studentRepository.save(student);
    }

    @Override
    @Transactional
    public void deleteStudent(Long id) {
        teacherAccessService.requireStudentAccess(id);

        if (!studentRepository.existsById(id)) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Student not found"
            );
        }

        attendanceRepository.deleteByStudent_Id(id);

        studentRepository.deleteById(id);
    }

    @Override
    @Transactional
    public int backfillMissingStudentUsers() {

        List<Student> studentsWithoutUser =
                studentRepository.findByUserIsNull();

        int linkedCount = 0;

        for (Student student : studentsWithoutUser) {

            User user = new User();

            user.setUsername(
                    generateUniqueBackfillUsername(student)
            );

            user.setPasswordHash(
                    passwordEncoder.encode(defaultStudentPassword)
            );

            user.setRole(Role.STUDENT);

            user = userRepository.save(user);

            student.setUser(user);

            studentRepository.save(student);

            linkedCount++;
        }

        return linkedCount;
    }

    private Student.Status resolveStatus(String status) {

        if (status == null || status.isBlank()) {
            return Student.Status.ACTIVE;
        }

        try {

            return Student.Status.valueOf(
                    status.trim().toUpperCase()
            );

        } catch (IllegalArgumentException ex) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid status"
            );
        }
    }

    private String normalizeRequired(
            String value,
            String fieldName
    ) {

        if (value == null || value.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + " is required"
            );
        }

        return value.trim();
    }

    private String generateUniqueBackfillUsername(Student student) {

        String roll =
                student.getRollNumber() == null
                        ? "unknown"
                        : student.getRollNumber()
                        .trim()
                        .toLowerCase(Locale.ROOT);

        roll = roll.replaceAll("[^a-z0-9._-]", "");

        if (roll.isBlank()) {
            roll = "student";
        }

        String base = roll + "@student.local";

        String candidate = base;

        int suffix = 1;

        while (userRepository.findByUsername(candidate).isPresent()) {

            candidate =
                    roll + "+" + suffix + "@student.local";

            suffix++;
        }

        return candidate;
    }

    private Long resolveAdminId(Course course) {

        if (course == null || course.getTeacher() == null || course.getTeacher().getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Assigned course must belong to an admin"
            );
        }

        return course.getTeacher().getId();
    }
}
