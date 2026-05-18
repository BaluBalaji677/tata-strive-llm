package com.example.demo.service;

import java.util.List;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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

    public StudentServiceImpl(
            StudentRepository studentRepository,
            UserRepository userRepository,
            AttendanceRepository attendanceRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.attendanceRepository = attendanceRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public Student createStudent(
            String fullName,
            String username,
            String rollNumber,
            String status
    ) {

        String normalizedRollNumber =
                normalizeRequired(rollNumber, "rollNumber");

        if (studentRepository.findByRollNumber(normalizedRollNumber).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "rollNumber already exists"
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

        return studentRepository.save(student);
    }

    @Override
    @Transactional
    public Student updateStudent(
            Long id,
            String fullName,
            String username,
            String rollNumber,
            String status
    ) {

        Student student = studentRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Student not found"
                        )
                );

        String normalizedRollNumber =
                normalizeRequired(rollNumber, "rollNumber");

        studentRepository.findByRollNumber(normalizedRollNumber)
                .ifPresent(existing -> {

                    if (!existing.getId().equals(id)) {

                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "rollNumber already exists"
                        );
                    }
                });

        student.setRollNumber(normalizedRollNumber);

        student.setFullName(
                normalizeRequired(fullName, "fullName")
        );

        student.setStatus(resolveStatus(status));

        String normalizedUsername =
                username == null ? "" : username.trim();

        if (!normalizedUsername.isEmpty()) {

            User linkedUser = student.getUser();

            if (linkedUser != null) {

                userRepository.findByUsername(normalizedUsername)
                        .ifPresent(existingUser -> {

                            if (!existingUser.getId()
                                    .equals(linkedUser.getId())) {

                                throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "username already exists"
                                );
                            }
                        });

                linkedUser.setUsername(normalizedUsername);

                userRepository.save(linkedUser);

            } else {

                if (userRepository.findByUsername(normalizedUsername).isPresent()) {

                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "username already exists"
                    );
                }

                User user = new User();

                user.setUsername(normalizedUsername);

                user.setPasswordHash(
                        passwordEncoder.encode(defaultStudentPassword)
                );

                user.setRole(Role.STUDENT);

                student.setUser(userRepository.save(user));
            }
        }

        return studentRepository.save(student);
    }

    @Override
    @Transactional
    public void deleteStudent(Long id) {

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
}