package com.example.demo;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.example.demo.entity.Course;
import com.example.demo.entity.Role;
import com.example.demo.entity.Student;
import com.example.demo.entity.User;
import com.example.demo.entity.LmsTask;
import com.example.demo.entity.TaskAssignment;
import com.example.demo.repository.AttendanceRepository;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.LmsTaskRepository;
import com.example.demo.repository.TaskAssignmentRepository;
import com.example.demo.controller.AdminTaskController;
import com.example.demo.controller.StudentTaskController;
import com.example.demo.entity.Quiz;
import com.example.demo.entity.Question;
import com.example.demo.entity.QuizSubmission;
import com.example.demo.repository.QuizRepository;
import com.example.demo.repository.QuestionRepository;
import com.example.demo.repository.QuizAssignmentRepository;
import com.example.demo.repository.QuizSubmissionRepository;
import com.example.demo.repository.QuizAnswerRepository;
import com.example.demo.controller.AdminQuizController;
import com.example.demo.controller.StudentQuizController;
import com.example.demo.dto.QuestionDto;
import com.example.demo.dto.QuizDetailsDto;
import com.example.demo.service.TeacherAccessService;
import com.example.demo.service.AttendanceReportService;
import com.example.demo.controller.AdminReportController;

import java.util.Optional;
import java.util.List;
import java.util.Map;

class DemoApplicationTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private TeacherAccessService teacherAccessService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
    }

    @Test
    void contextLoads() {
        org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        java.sql.Connection conn = null;
        try {
            conn = java.sql.DriverManager.getConnection("jdbc:mysql://localhost:3306/lms_bd", "root", "Balu112233");
            java.sql.Statement stmt = conn.createStatement();
            java.sql.ResultSet rs = stmt.executeQuery(
                "SELECT u.id, u.username, u.password_hash, u.role, s.roll_number, s.full_name " +
                "FROM users u LEFT JOIN students s ON u.id = s.user_id WHERE u.id IN (3, 12, 17, 20)"
            );
            java.util.List<java.util.Map<String, String>> users = new java.util.ArrayList<>();
            while (rs.next()) {
                java.util.Map<String, String> user = new java.util.HashMap<>();
                user.put("id", rs.getString("id"));
                user.put("username", rs.getString("username"));
                user.put("password_hash", rs.getString("password_hash"));
                user.put("role", rs.getString("role"));
                user.put("roll_number", rs.getString("roll_number"));
                user.put("full_name", rs.getString("full_name"));
                users.add(user);
            }
            rs.close();
            stmt.close();

            System.out.println("--- DB PASSWORD MATCH AUDIT START ---");
            for (java.util.Map<String, String> user : users) {
                String username = user.get("username");
                String hash = user.get("password_hash");
                String roll = user.get("roll_number");
                String name = user.get("full_name");

                java.util.Set<String> candidates = new java.util.LinkedHashSet<>();
                candidates.add("Balu112233");
                candidates.add("Balu@123");
                candidates.add("balu@123");
                candidates.add("balu123");
                candidates.add("balu");
                candidates.add("Balu");
                candidates.add("balaji");
                candidates.add("Balaji");
                candidates.add("12345");
                candidates.add("123456");
                candidates.add("12345678");

                if (username != null) {
                    candidates.add(username);
                    String localPart = username.contains("@") ? username.split("@")[0] : username;
                    candidates.add(localPart);
                    // Extract all digit sequences
                    java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\d+").matcher(localPart);
                    while (m.find()) {
                        candidates.add(m.group());
                    }
                }
                if (roll != null) {
                    candidates.add(roll);
                    candidates.add(roll.toLowerCase());
                    candidates.add(roll.toUpperCase());
                }

                boolean found = false;
                for (String cand : candidates) {
                    try {
                        if (encoder.matches(cand, hash)) {
                            System.out.println("MATCH FOUND: username=" + username + ", password=" + cand);
                            found = true;
                            break;
                        }
                    } catch (Exception e) {}
                }
                if (!found) {
                    System.out.println("NO MATCH FOUND: username=" + username + ", hash=" + hash);
                }
            }
            System.out.println("--- DB PASSWORD MATCH AUDIT END ---");

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (conn != null) {
                try { conn.close(); } catch (Exception e) {}
            }
        }
    }






    @Test
    void testValidateCourseAccess_Principal_Allowed() {
        // Arrange
        String username = "principalUser";
        User user = new User();
        user.setUsername(username);
        user.setRole(Role.PRINCIPAL);

        Course course = new Course();
        course.setId(9L);

        when(authentication.getName()).thenReturn(username);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));

        // Act & Assert
        assertDoesNotThrow(() -> teacherAccessService.validateCourseAccess(course));
    }

    @Test
    void testValidateCourseAccess_AdminUsername_Allowed() {
        // Arrange
        String username = "admin";
        User user = new User();
        user.setUsername(username);
        user.setRole(Role.ADMIN);

        Course course = new Course();
        course.setId(9L);

        when(authentication.getName()).thenReturn(username);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));

        // Act & Assert
        assertDoesNotThrow(() -> teacherAccessService.validateCourseAccess(course));
    }

    @Test
    void testValidateCourseAccess_StudentEnrolled_Allowed() {
        // Arrange
        String username = "studentUser";
        User user = new User();
        user.setUsername(username);
        user.setRole(Role.STUDENT);

        Course course = new Course();
        course.setId(9L);

        Student student = new Student();
        student.setUser(user);
        student.setCourse(course);

        when(authentication.getName()).thenReturn(username);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(studentRepository.findByUser_Username(username)).thenReturn(Optional.of(student));

        // Act & Assert
        assertDoesNotThrow(() -> teacherAccessService.validateCourseAccess(course));
    }

    @Test
    void testValidateCourseAccess_StudentNotEnrolled_ThrowsForbidden() {
        // Arrange
        String username = "studentUser";
        User user = new User();
        user.setUsername(username);
        user.setRole(Role.STUDENT);

        Course course = new Course();
        course.setId(9L);

        Course otherCourse = new Course();
        otherCourse.setId(10L);

        Student student = new Student();
        student.setUser(user);
        student.setCourse(otherCourse);

        when(authentication.getName()).thenReturn(username);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(studentRepository.findByUser_Username(username)).thenReturn(Optional.of(student));

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, 
            () -> teacherAccessService.validateCourseAccess(course));
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        assertEquals("You are not enrolled in this course", exception.getReason());
    }

    @Test
    void testValidateCourseAccess_TeacherAssigned_Allowed() {
        // Arrange
        String username = "teacherUser";
        User user = new User();
        user.setId(5L);
        user.setUsername(username);
        user.setRole(Role.ADMIN);

        Course course = new Course();
        course.setId(9L);
        course.setTeacher(user);

        when(authentication.getName()).thenReturn(username);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));

        // Act & Assert
        assertDoesNotThrow(() -> teacherAccessService.validateCourseAccess(course));
    }

    @Test
    void testValidateCourseAccess_TeacherNotAssigned_ThrowsForbidden() {
        // Arrange
        String username = "teacherUser";
        User user = new User();
        user.setId(5L);
        user.setUsername(username);
        user.setRole(Role.ADMIN);

        User otherTeacher = new User();
        otherTeacher.setId(6L);

        Course course = new Course();
        course.setId(9L);
        course.setTeacher(otherTeacher);

        when(authentication.getName()).thenReturn(username);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, 
            () -> teacherAccessService.validateCourseAccess(course));
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        assertEquals("You do not have access to this course", exception.getReason());
    }

    @Mock
    private AttendanceRepository attendanceRepository;

    private com.example.demo.service.AttendanceServiceImpl attendanceServiceImpl;

    @Test
    void testGetAllAttendance_FiltersByAdmin() {
        // Arrange
        MockitoAnnotations.openMocks(this);
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        attendanceServiceImpl = new com.example.demo.service.AttendanceServiceImpl(attendanceRepository, studentRepository, userRepository);

        String username = "admin1";
        User admin = new User();
        admin.setUsername(username);
        admin.setRole(Role.ADMIN);

        when(authentication.getName()).thenReturn(username);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(admin));

        java.util.List<com.example.demo.entity.Attendance> expectedList = java.util.List.of(new com.example.demo.entity.Attendance());
        when(attendanceRepository.findByMarkedByUserOrderByDateDesc(admin)).thenReturn(expectedList);

        // Act
        java.util.List<com.example.demo.entity.Attendance> result = attendanceServiceImpl.getAllAttendance(null);

        // Assert
        assertEquals(expectedList, result);
        verify(attendanceRepository, times(1)).findByMarkedByUserOrderByDateDesc(admin);
    }

    @Test
    void testGetAllAttendance_IsolationBetweenAdminAAndAdminB() {
        // Arrange
        MockitoAnnotations.openMocks(this);
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        attendanceServiceImpl = new com.example.demo.service.AttendanceServiceImpl(attendanceRepository, studentRepository, userRepository);

        // Create Admin A
        User adminA = new User();
        adminA.setUsername("adminA");
        adminA.setRole(Role.ADMIN);

        // Create Admin B
        User adminB = new User();
        adminB.setUsername("adminB");
        adminB.setRole(Role.ADMIN);

        // Setup mock lists
        com.example.demo.entity.Attendance recA = new com.example.demo.entity.Attendance();
        recA.setMarkedByUser(adminA);
        java.util.List<com.example.demo.entity.Attendance> listA = java.util.List.of(recA);

        com.example.demo.entity.Attendance recB = new com.example.demo.entity.Attendance();
        recB.setMarkedByUser(adminB);
        java.util.List<com.example.demo.entity.Attendance> listB = java.util.List.of(recB);

        when(attendanceRepository.findByMarkedByUserOrderByDateDesc(adminA)).thenReturn(listA);
        when(attendanceRepository.findByMarkedByUserOrderByDateDesc(adminB)).thenReturn(listB);

        // Scenario 1: Login as Admin A
        when(authentication.getName()).thenReturn("adminA");
        when(userRepository.findByUsername("adminA")).thenReturn(Optional.of(adminA));
        java.util.List<com.example.demo.entity.Attendance> resultA = attendanceServiceImpl.getAllAttendance(null);
        assertEquals(listA, resultA);
        assertEquals(adminA, resultA.get(0).getMarkedByUser());

        // Scenario 2: Login as Admin B
        when(authentication.getName()).thenReturn("adminB");
        when(userRepository.findByUsername("adminB")).thenReturn(Optional.of(adminB));
        java.util.List<com.example.demo.entity.Attendance> resultB = attendanceServiceImpl.getAllAttendance(null);
        assertEquals(listB, resultB);
        assertEquals(adminB, resultB.get(0).getMarkedByUser());
    }

    @Test
    void testMarkTodayAttendance_SetsMarkedByUser() {
        // Arrange
        MockitoAnnotations.openMocks(this);
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        attendanceServiceImpl = new com.example.demo.service.AttendanceServiceImpl(attendanceRepository, studentRepository, userRepository);

        String username = "admin1";
        User admin = new User();
        admin.setUsername(username);
        admin.setRole(Role.ADMIN);

        String rollNumber = "STU01";
        Student student = new Student();
        student.setId(1L);
        student.setRollNumber(rollNumber);

        when(authentication.getName()).thenReturn(username);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(admin));
        when(studentRepository.findByRollNumber(rollNumber)).thenReturn(Optional.of(student));
        when(attendanceRepository.findByStudentAndDate(any(), any())).thenReturn(Optional.empty());
        when(attendanceRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        com.example.demo.entity.Attendance result = attendanceServiceImpl.markTodayAttendance(rollNumber, true);

        // Assert
        assertNotNull(result);
        assertEquals(student, result.getStudent());
        assertEquals(admin, result.getMarkedByUser());
        assertTrue(result.isPresent());
        verify(attendanceRepository, times(1)).save(any());
    }

    @org.junit.jupiter.api.Nested
    class TaskManagementTests {
        @Mock
        private LmsTaskRepository lmsTaskRepo;
        @Mock
        private TaskAssignmentRepository taskAssignmentRepo;
        @Mock
        private StudentRepository studentRepo;
        @Mock
        private CourseRepository courseRepo;
        @Mock
        private TeacherAccessService teacherAccess;

        private AdminTaskController adminController;
        private StudentTaskController studentController;

        @BeforeEach
        void setUp() {
            MockitoAnnotations.openMocks(this);
            adminController = new AdminTaskController(lmsTaskRepo, taskAssignmentRepo, studentRepo, courseRepo, teacherAccess);
            studentController = new StudentTaskController(taskAssignmentRepo, studentRepo);
            SecurityContextHolder.setContext(securityContext);
            when(securityContext.getAuthentication()).thenReturn(authentication);
        }

        @Test
        void testCreateTaskForSingleStudent() {
            User admin = new User();
            admin.setUsername("admin1");
            when(teacherAccess.requireCurrentUser()).thenReturn(admin);

            LmsTask savedTask = new LmsTask();
            savedTask.setId(1L);
            savedTask.setTitle("Test Task");
            when(lmsTaskRepo.save(any())).thenReturn(savedTask);

            Student student = new Student();
            student.setId(10L);
            student.setFullName("John Doe");
            when(studentRepo.findById(10L)).thenReturn(Optional.of(student));
            when(taskAssignmentRepo.existsByTaskAndStudent(any(), any())).thenReturn(false);

            AdminTaskController.CreateTaskRequest request = new AdminTaskController.CreateTaskRequest(
                    "Test Task", "Description", "2026-06-01", null, 10L, "SINGLE"
            );

            ResponseEntity<LmsTask> response = adminController.createTask(request);

            assertNotNull(response.getBody());
            assertEquals(1L, response.getBody().getId());
            verify(taskAssignmentRepo, times(1)).save(any());
        }

        @Test
        void testCreateTaskForCourse() {
            User admin = new User();
            admin.setUsername("admin1");
            when(teacherAccess.requireCurrentUser()).thenReturn(admin);

            LmsTask savedTask = new LmsTask();
            savedTask.setId(2L);
            when(lmsTaskRepo.save(any())).thenReturn(savedTask);

            Course course = new Course();
            course.setId(5L);
            when(courseRepo.findById(5L)).thenReturn(Optional.of(course));

            Student student1 = new Student();
            student1.setId(21L);
            student1.setCourse(course);

            Student student2 = new Student();
            student2.setId(22L);
            student2.setCourse(course);

            when(studentRepo.findAll()).thenReturn(java.util.List.of(student1, student2));
            when(taskAssignmentRepo.existsByTaskAndStudent(any(), any())).thenReturn(false);

            AdminTaskController.CreateTaskRequest request = new AdminTaskController.CreateTaskRequest(
                    "Course Task", "Description", "2026-06-01", 5L, null, "ALL"
            );

            adminController.createTask(request);

            verify(taskAssignmentRepo, times(2)).save(any());
        }

        @Test
        void testDuplicateAssignmentPrevention() {
            User admin = new User();
            admin.setUsername("admin1");
            when(teacherAccess.requireCurrentUser()).thenReturn(admin);

            LmsTask savedTask = new LmsTask();
            savedTask.setId(3L);
            when(lmsTaskRepo.save(any())).thenReturn(savedTask);

            Student student = new Student();
            student.setId(10L);
            when(studentRepo.findById(10L)).thenReturn(Optional.of(student));
            
            // Duplicate returns true
            when(taskAssignmentRepo.existsByTaskAndStudent(any(), any())).thenReturn(true);

            AdminTaskController.CreateTaskRequest request = new AdminTaskController.CreateTaskRequest(
                    "Task", "Desc", "2026-06-01", null, 10L, "SINGLE"
            );

            adminController.createTask(request);

            verify(taskAssignmentRepo, never()).save(any(TaskAssignment.class));
        }

        @Test
        void testStudentSubmitOwnAssignment() {
            Student student = new Student();
            student.setId(10L);
            student.setRollNumber("STU01");
            when(authentication.getName()).thenReturn("STU01");
            when(studentRepo.findByRollNumber("STU01")).thenReturn(Optional.of(student));

            LmsTask task = new LmsTask();
            task.setId(1L);

            TaskAssignment assignment = new TaskAssignment();
            assignment.setId(100L);
            assignment.setStudent(student);
            assignment.setTask(task);
            assignment.setStatus("PENDING");

            when(taskAssignmentRepo.findById(100L)).thenReturn(Optional.of(assignment));

            ResponseEntity<StudentTaskController.StudentTaskResponse> response = studentController.submitTask(100L);

            assertNotNull(response.getBody());
            assertEquals("COMPLETED", response.getBody().status());
            verify(taskAssignmentRepo, times(1)).save(assignment);
        }

        @Test
        void testStudentSubmitForbidden() {
            Student loggedInStudent = new Student();
            loggedInStudent.setId(10L);
            loggedInStudent.setRollNumber("STU01");

            Student otherStudent = new Student();
            otherStudent.setId(11L);

            when(authentication.getName()).thenReturn("STU01");
            when(studentRepo.findByRollNumber("STU01")).thenReturn(Optional.of(loggedInStudent));

            LmsTask task = new LmsTask();
            task.setId(1L);

            TaskAssignment assignment = new TaskAssignment();
            assignment.setId(100L);
            assignment.setStudent(otherStudent); // Assigned to other student
            assignment.setTask(task);
            assignment.setStatus("PENDING");

            when(taskAssignmentRepo.findById(100L)).thenReturn(Optional.of(assignment));

            assertThrows(ResponseStatusException.class, () -> studentController.submitTask(100L));
            verify(taskAssignmentRepo, never()).save(any());
        }

        @Test
        void testSubmitCompletedTaskThrowsBadRequest() {
            Student student = new Student();
            student.setId(10L);
            student.setRollNumber("STU01");
            when(authentication.getName()).thenReturn("STU01");
            when(studentRepo.findByRollNumber("STU01")).thenReturn(Optional.of(student));

            LmsTask task = new LmsTask();
            task.setId(1L);

            TaskAssignment assignment = new TaskAssignment();
            assignment.setId(100L);
            assignment.setStudent(student);
            assignment.setTask(task);
            assignment.setStatus("COMPLETED");

            when(taskAssignmentRepo.findById(100L)).thenReturn(Optional.of(assignment));

            assertThrows(ResponseStatusException.class, () -> studentController.submitTask(100L));
            verify(taskAssignmentRepo, never()).save(any());
        }

        @Test
        void testTaskOwnershipIsolation() {
            // Setup two admins
            User admin1 = new User();
            admin1.setId(101L);
            admin1.setUsername("admin1");
            admin1.setRole(Role.ADMIN);

            User admin2 = new User();
            admin2.setId(102L);
            admin2.setUsername("admin2");
            admin2.setRole(Role.ADMIN);

            // Setup a task created by admin1
            LmsTask taskA = new LmsTask();
            taskA.setId(1L);
            taskA.setTitle("Task A");
            taskA.setCreatedBy(admin1);

            when(lmsTaskRepo.findById(1L)).thenReturn(Optional.of(taskA));

            // Admin2 attempts to access/update/delete Task A
            when(teacherAccess.requireCurrentUser()).thenReturn(admin2);

            ResponseStatusException exGet = assertThrows(ResponseStatusException.class, () -> adminController.getTaskById(1L));
            assertEquals(HttpStatus.FORBIDDEN, exGet.getStatusCode());

            AdminTaskController.UpdateTaskRequest updateReq = new AdminTaskController.UpdateTaskRequest("Updated", "Desc", "2026-06-01");
            ResponseStatusException exPut = assertThrows(ResponseStatusException.class, () -> adminController.updateTask(1L, updateReq));
            assertEquals(HttpStatus.FORBIDDEN, exPut.getStatusCode());

            ResponseStatusException exDelete = assertThrows(ResponseStatusException.class, () -> adminController.deleteTask(1L));
            assertEquals(HttpStatus.FORBIDDEN, exDelete.getStatusCode());

            // Principal attempts to access/update/delete Task A (should succeed)
            User principal = new User();
            principal.setId(100L);
            principal.setUsername("principal");
            principal.setRole(Role.PRINCIPAL);

            when(teacherAccess.requireCurrentUser()).thenReturn(principal);
            assertDoesNotThrow(() -> adminController.getTaskById(1L));
        }
    }

    @org.junit.jupiter.api.Nested
    class QuizManagementTests {
        @Mock
        private QuizRepository quizRepo;
        @Mock
        private QuestionRepository questionRepo;
        @Mock
        private QuizAssignmentRepository quizAssignmentRepo;
        @Mock
        private QuizSubmissionRepository quizSubmissionRepo;
        @Mock
        private QuizAnswerRepository quizAnswerRepo;
        @Mock
        private StudentRepository studentRepo;
        @Mock
        private CourseRepository courseRepo;
        @Mock
        private TeacherAccessService teacherAccess;

        @InjectMocks
        private AdminQuizController adminController;
        @InjectMocks
        private StudentQuizController studentController;

        @BeforeEach
        void setUp() {
            MockitoAnnotations.openMocks(this);
            SecurityContextHolder.setContext(securityContext);
            when(securityContext.getAuthentication()).thenReturn(authentication);
        }

        @Test
        void testCreateQuizAndAssign() {
            User admin = new User();
            admin.setId(1L);
            admin.setUsername("admin1");
            admin.setRole(Role.ADMIN);
            when(teacherAccess.requireCurrentUser()).thenReturn(admin);

            Quiz savedQuiz = new Quiz();
            savedQuiz.setId(1L);
            savedQuiz.setTitle("Midterm Exam");
            when(quizRepo.save(any())).thenReturn(savedQuiz);

            Course course = new Course();
            course.setId(100L);
            course.setTeacher(admin);

            Student student = new Student();
            student.setId(10L);
            student.setCourse(course);
            when(studentRepo.findById(10L)).thenReturn(Optional.of(student));
            when(quizAssignmentRepo.existsByQuizAndStudent(any(), any())).thenReturn(false);

            List<QuestionDto> questions = List.of(
                new QuestionDto(null, "Q1?", "A", "B", "C", "D", "A")
            );

            AdminQuizController.CreateQuizRequest request = new AdminQuizController.CreateQuizRequest(
                "Midterm Exam", "Description", null, false, questions, "SINGLE", 10L
            );

            ResponseEntity<Quiz> response = adminController.createQuiz(request);

            assertNotNull(response.getBody());
            assertEquals(1L, response.getBody().getId());
            verify(quizAssignmentRepo, times(1)).save(any());
        }

        @Test
        void testGetQuizMasksCorrectAnswers() {
            Student student = new Student();
            student.setId(10L);
            student.setRollNumber("STU01");
            when(authentication.getName()).thenReturn("STU01");
            when(studentRepo.findByRollNumber("STU01")).thenReturn(Optional.of(student));

            Quiz quiz = new Quiz();
            quiz.setId(1L);
            quiz.setTitle("Midterm Exam");
            quiz.setActive(true);

            when(quizRepo.findById(1L)).thenReturn(Optional.of(quiz));
            when(quizAssignmentRepo.existsByQuizAndStudentAndTeacherMatches(any(), any())).thenReturn(true);

            Question q1 = new Question();
            q1.setId(5L);
            q1.setQuestion("Q1?");
            q1.setOptionA("A");
            q1.setOptionB("B");
            q1.setOptionC("C");
            q1.setOptionD("D");
            q1.setCorrectAnswer("A");

            when(questionRepo.findByQuizId(1L)).thenReturn(List.of(q1));

            ResponseEntity<QuizDetailsDto> response = studentController.getQuizById(1L);

            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().getQuestions().size());
            assertNull(response.getBody().getQuestions().get(0).getCorrectAnswer()); // Verify Masking!
        }

        @Test
        void testStudentSubmitQuizAutoGrading() {
            Student student = new Student();
            student.setId(10L);
            student.setRollNumber("STU01");
            when(authentication.getName()).thenReturn("STU01");
            when(studentRepo.findByRollNumber("STU01")).thenReturn(Optional.of(student));

            Quiz quiz = new Quiz();
            quiz.setId(1L);
            quiz.setActive(true);
            quiz.setAllowMultipleSubmissions(true);

            when(quizRepo.findById(1L)).thenReturn(Optional.of(quiz));
            when(quizAssignmentRepo.existsByQuizAndStudentAndTeacherMatches(any(), any())).thenReturn(true);

            Question q1 = new Question();
            q1.setId(5L);
            q1.setCorrectAnswer("A");

            Question q2 = new Question();
            q2.setId(6L);
            q2.setCorrectAnswer("B");

            when(questionRepo.findByQuizId(1L)).thenReturn(List.of(q1, q2));

            // Mock saving submission
            QuizSubmission submission = new QuizSubmission();
            submission.setId(100L);
            when(quizSubmissionRepo.save(any())).thenReturn(submission);

            Map<Long, String> answers = Map.of(
                5L, "A", // Correct
                6L, "C"  // Incorrect
            );

            StudentQuizController.StudentSubmitRequest request = new StudentQuizController.StudentSubmitRequest();
            request.setAnswers(answers);

            ResponseEntity<StudentQuizController.StudentSubmitResultResponse> response = studentController.submitQuiz(1L, request);

            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().score()); // 1 correct, 1 incorrect
            assertEquals(2, response.getBody().maxScore());
        }

        @Test
        void testQuizOwnershipIsolation() {
            // Setup two admins
            User admin1 = new User();
            admin1.setId(101L);
            admin1.setUsername("admin1");
            admin1.setRole(Role.ADMIN);

            User admin2 = new User();
            admin2.setId(102L);
            admin2.setUsername("admin2");
            admin2.setRole(Role.ADMIN);

            // Setup a quiz created by admin1
            Quiz quizA = new Quiz();
            quizA.setId(1L);
            quizA.setTitle("Quiz A");
            quizA.setCreatedBy(admin1);
            quizA.setActive(true);

            when(quizRepo.findById(1L)).thenReturn(Optional.of(quizA));

            // Admin2 attempts to access/update/delete Quiz A
            when(teacherAccess.requireCurrentUser()).thenReturn(admin2);

            ResponseStatusException exGet = assertThrows(ResponseStatusException.class, () -> adminController.getQuizById(1L));
            assertEquals(HttpStatus.FORBIDDEN, exGet.getStatusCode());

            AdminQuizController.UpdateQuizRequest updateReq = new AdminQuizController.UpdateQuizRequest("Updated", "Desc", false, List.of());
            ResponseStatusException exPut = assertThrows(ResponseStatusException.class, () -> adminController.updateQuiz(1L, updateReq));
            assertEquals(HttpStatus.FORBIDDEN, exPut.getStatusCode());

            ResponseStatusException exDelete = assertThrows(ResponseStatusException.class, () -> adminController.deleteQuiz(1L));
            assertEquals(HttpStatus.FORBIDDEN, exDelete.getStatusCode());

            // Principal attempts to access/update/delete Quiz A (should succeed)
            User principal = new User();
            principal.setId(100L);
            principal.setUsername("principal");
            principal.setRole(Role.PRINCIPAL);

            when(teacherAccess.requireCurrentUser()).thenReturn(principal);
            assertDoesNotThrow(() -> adminController.getQuizById(1L));
        }

        @Test
        void testStudentQuizOwnershipIsolation() {
            // Setup two admins
            User admin1 = new User();
            admin1.setId(101L);
            admin1.setRole(Role.ADMIN);

            User admin2 = new User();
            admin2.setId(102L);
            admin2.setRole(Role.ADMIN);

            // Setup courses
            Course course1 = new Course();
            course1.setId(201L);
            course1.setTeacher(admin1);

            Course course2 = new Course();
            course2.setId(202L);
            course2.setTeacher(admin2);

            // Setup student under Admin1
            Student student = new Student();
            student.setId(10L);
            student.setRollNumber("STU01");
            student.setCourse(course1);

            when(authentication.getName()).thenReturn("STU01");
            when(studentRepo.findByRollNumber("STU01")).thenReturn(Optional.of(student));

            // Quizzes
            Quiz quizA1 = new Quiz();
            quizA1.setId(1L);
            quizA1.setCreatedBy(admin1);
            quizA1.setActive(true);

            Quiz quizA2 = new Quiz();
            quizA2.setId(2L);
            quizA2.setCreatedBy(admin2);
            quizA2.setActive(true);

            // Mock repos
            when(quizRepo.findById(1L)).thenReturn(Optional.of(quizA1));
            when(quizRepo.findById(2L)).thenReturn(Optional.of(quizA2));

            // Setup assignment matches
            when(quizAssignmentRepo.existsByQuizAndStudentAndTeacherMatches(quizA1, student)).thenReturn(true);
            when(quizAssignmentRepo.existsByQuizAndStudentAndTeacherMatches(quizA2, student)).thenReturn(false);

            // Student can access Admin1's quiz
            assertDoesNotThrow(() -> studentController.getQuizById(1L));

            // Student is blocked from Admin2's quiz
            ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> studentController.getQuizById(2L));
            assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        }

        @Test
        void testAdminQuizAssignmentIsolation() {
            User admin1 = new User();
            admin1.setId(101L);
            admin1.setRole(Role.ADMIN);

            User admin2 = new User();
            admin2.setId(102L);
            admin2.setRole(Role.ADMIN);

            // Courses
            Course course1 = new Course();
            course1.setId(201L);
            course1.setTeacher(admin1);

            Course course2 = new Course();
            course2.setId(202L);
            course2.setTeacher(admin2);

            // Students
            Student student1 = new Student();
            student1.setId(10L);
            student1.setCourse(course1);

            Student student2 = new Student();
            student2.setId(11L);
            student2.setCourse(course2);

            // Setup mock repo findByCourse_Teacher_Id for Admin1
            when(studentRepo.findByCourse_Teacher_Id(101L)).thenReturn(List.of(student1));

            // Setup mock studentRepo findById
            when(studentRepo.findById(10L)).thenReturn(Optional.of(student1));
            when(studentRepo.findById(11L)).thenReturn(Optional.of(student2));

            // Setup mock courseRepo findById
            when(courseRepo.findById(201L)).thenReturn(Optional.of(course1));
            when(courseRepo.findById(202L)).thenReturn(Optional.of(course2));

            // Quiz mock saving
            Quiz quiz = new Quiz();
            quiz.setId(5L);
            when(quizRepo.save(any())).thenReturn(quiz);

            // Admin1 tries to assign SINGLE quiz to student2 (Admin2's student) -> should throw FORBIDDEN
            when(teacherAccess.requireCurrentUser()).thenReturn(admin1);
            AdminQuizController.CreateQuizRequest req1 = new AdminQuizController.CreateQuizRequest(
                "Title", "Desc", null, false, List.of(), "SINGLE", 11L
            );
            assertThrows(ResponseStatusException.class, () -> adminController.createQuiz(req1));

            // Admin1 tries to assign quiz to course2 (Admin2's course) -> should throw FORBIDDEN
            AdminQuizController.CreateQuizRequest req2 = new AdminQuizController.CreateQuizRequest(
                "Title", "Desc", 202L, false, List.of(), "COURSE", null
            );
            assertThrows(ResponseStatusException.class, () -> adminController.createQuiz(req2));

            // Admin1 assigns to course1 (Admin1's course) -> should succeed
            AdminQuizController.CreateQuizRequest req3 = new AdminQuizController.CreateQuizRequest(
                "Title", "Desc", 201L, false, List.of(), "COURSE", null
            );
            assertDoesNotThrow(() -> adminController.createQuiz(req3));
        }
    }

    @org.junit.jupiter.api.Nested
    class AttendanceReportTests {
        @Mock
        private AttendanceReportService attendanceReportService;
        @Mock
        private UserRepository userRepository;

        private AdminReportController adminReportController;

        @BeforeEach
        void setUp() {
            MockitoAnnotations.openMocks(this);
            adminReportController = new AdminReportController(attendanceReportService, userRepository);
            SecurityContextHolder.setContext(securityContext);
            when(securityContext.getAuthentication()).thenReturn(authentication);
        }

        @Test
        void testDownloadTodayReport_Principal_ReturnsAllStudentsReport() {
            String username = "principal1";
            User principal = new User();
            principal.setUsername(username);
            principal.setRole(Role.PRINCIPAL);

            when(authentication.getName()).thenReturn(username);
            when(userRepository.findByUsername(username)).thenReturn(Optional.of(principal));

            byte[] mockExcel = new byte[]{1, 2, 3};
            when(attendanceReportService.generateTodayReportForUser(principal)).thenReturn(mockExcel);

            ResponseEntity<org.springframework.core.io.Resource> response = adminReportController.downloadTodayReport();

            assertNotNull(response.getBody());
            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(attendanceReportService, times(1)).generateTodayReportForUser(principal);
        }

        @Test
        void testDownloadTodayReport_Admin_ReturnsOnlyOwnStudentsReport() {
            String username = "admin1";
            User admin = new User();
            admin.setUsername(username);
            admin.setRole(Role.ADMIN);

            when(authentication.getName()).thenReturn(username);
            when(userRepository.findByUsername(username)).thenReturn(Optional.of(admin));

            byte[] mockExcel = new byte[]{4, 5, 6};
            when(attendanceReportService.generateTodayReportForUser(admin)).thenReturn(mockExcel);

            ResponseEntity<org.springframework.core.io.Resource> response = adminReportController.downloadTodayReport();

            assertNotNull(response.getBody());
            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(attendanceReportService, times(1)).generateTodayReportForUser(admin);
        }

        @Test
        void testGenerateTodayReportForUser_Principal_CallsFindAll() {
            StudentRepository mockStudentRepo = mock(StudentRepository.class);
            AttendanceRepository mockAttendanceRepo = mock(AttendanceRepository.class);
            AttendanceReportService service = new com.example.demo.service.impl.AttendanceReportServiceImpl(mockStudentRepo, mockAttendanceRepo);

            User principal = new User();
            principal.setRole(Role.PRINCIPAL);

            try {
                service.generateTodayReportForUser(principal);
            } catch (Exception e) {}

            verify(mockStudentRepo, times(1)).findAll();
            verify(mockStudentRepo, never()).findByCourse_Teacher_Id(any());
        }

        @Test
        void testGenerateTodayReportForUser_Admin_CallsFindByCourse_Teacher_Id() {
            StudentRepository mockStudentRepo = mock(StudentRepository.class);
            AttendanceRepository mockAttendanceRepo = mock(AttendanceRepository.class);
            AttendanceReportService service = new com.example.demo.service.impl.AttendanceReportServiceImpl(mockStudentRepo, mockAttendanceRepo);

            User admin = new User();
            admin.setId(42L);
            admin.setRole(Role.ADMIN);

            try {
                service.generateTodayReportForUser(admin);
            } catch (Exception e) {}

            verify(mockStudentRepo, never()).findAll();
            verify(mockStudentRepo, times(1)).findByCourse_Teacher_Id(42L);
        }
    }
}
