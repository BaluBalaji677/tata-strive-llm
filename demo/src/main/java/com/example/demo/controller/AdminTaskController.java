package com.example.demo.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.entity.Course;
import com.example.demo.entity.LmsTask;
import com.example.demo.entity.Student;
import com.example.demo.entity.TaskAssignment;
import com.example.demo.entity.User;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.LmsTaskRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TaskAssignmentRepository;
import com.example.demo.service.TeacherAccessService;

@RestController
@RequestMapping("/admin/tasks")
@PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
public class AdminTaskController {

    private final LmsTaskRepository lmsTaskRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final TeacherAccessService teacherAccessService;

    public AdminTaskController(
            LmsTaskRepository lmsTaskRepository,
            TaskAssignmentRepository taskAssignmentRepository,
            StudentRepository studentRepository,
            CourseRepository courseRepository,
            TeacherAccessService teacherAccessService
    ) {
        this.lmsTaskRepository = lmsTaskRepository;
        this.taskAssignmentRepository = taskAssignmentRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.teacherAccessService = teacherAccessService;
    }

    public record CreateTaskRequest(
            String title,
            String description,
            String dueDate,
            Long courseId,
            Long studentId,
            String assignTo
    ) {}

    public record UpdateTaskRequest(
            String title,
            String description,
            String dueDate
    ) {}

    public record TaskAssignmentResponse(
            Long id,
            Long taskId,
            String title,
            String description,
            String dueDate,
            Long courseId,
            String courseTitle,
            Long studentId,
            String studentName,
            String studentRollNumber,
            String status,
            String assignedAt,
            String completedAt
    ) {}

    public record TaskDetailsResponse(
            Long id,
            String title,
            String description,
            String dueDate,
            Long courseId,
            String courseTitle,
            Long createdById,
            String createdByUsername,
            Boolean active,
            long totalAssignments,
            long completedAssignments
    ) {}

    @PostMapping
    public ResponseEntity<LmsTask> createTask(@RequestBody CreateTaskRequest request) {
        if (request.title() == null || request.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }

        User currentUser = teacherAccessService.requireCurrentUser();

        LmsTask task = new LmsTask();
        task.setTitle(request.title());
        task.setDescription(request.description());
        if (request.dueDate() != null && !request.dueDate().isBlank()) {
            task.setDueDate(LocalDate.parse(request.dueDate()));
        }
        if (request.courseId() != null) {
            Course course = courseRepository.findById(request.courseId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
            task.setCourse(course);
        }
        task.setCreatedBy(currentUser);
        task = lmsTaskRepository.save(task);

        // Assign to student(s)
        if ("SINGLE".equalsIgnoreCase(request.assignTo()) && request.studentId() != null) {
            Student student = studentRepository.findById(request.studentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
            createAssignmentIfNotExists(task, student);
        } else {
            // Assign to ALL students
            List<Student> students;
            if (request.courseId() != null) {
                // All students in course
                Long cid = request.courseId();
                students = studentRepository.findAll().stream()
                        .filter(s -> s.getCourse() != null && s.getCourse().getId().equals(cid))
                        .toList();
            } else {
                // All students in database
                students = studentRepository.findAll();
            }
            for (Student student : students) {
                createAssignmentIfNotExists(task, student);
            }
        }

        return ResponseEntity.ok(task);
    }

    private void createAssignmentIfNotExists(LmsTask task, Student student) {
        if (!taskAssignmentRepository.existsByTaskAndStudent(task, student)) {
            TaskAssignment assignment = new TaskAssignment();
            assignment.setTask(task);
            assignment.setStudent(student);
            assignment.setStatus("PENDING");
            taskAssignmentRepository.save(assignment);
        }
    }

    @GetMapping
    public ResponseEntity<Page<TaskAssignmentResponse>> getTasks(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dueDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        LocalDate parsedDate = null;
        if (dueDate != null && !dueDate.isBlank()) {
            parsedDate = LocalDate.parse(dueDate);
        }

        User currentUser = teacherAccessService.requireCurrentUser();
        Long createdById = "PRINCIPAL".equals(currentUser.getRole().name()) ? null : currentUser.getId();

        Pageable pageable = PageRequest.of(page, size);
        Page<TaskAssignment> assignments = taskAssignmentRepository.filterAssignments(
                title, courseId, studentId, status, parsedDate, createdById, pageable
        );

        Page<TaskAssignmentResponse> response = assignments.map(this::toAssignmentResponse);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDetailsResponse> getTaskById(@PathVariable Long id) {
        LmsTask task = lmsTaskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        User currentUser = teacherAccessService.requireCurrentUser();
        if (!"PRINCIPAL".equals(currentUser.getRole().name()) && task.getCreatedBy() != null) {
            if (!task.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this task");
            }
        }

        long total = taskAssignmentRepository.countByTaskId(id);
        long completed = taskAssignmentRepository.countByTaskIdAndStatus(id, "COMPLETED");

        TaskDetailsResponse response = new TaskDetailsResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getDueDate() != null ? task.getDueDate().toString() : null,
                task.getCourse() != null ? task.getCourse().getId() : null,
                task.getCourse() != null ? task.getCourse().getTitle() : null,
                task.getCreatedBy() != null ? task.getCreatedBy().getId() : null,
                task.getCreatedBy() != null ? task.getCreatedBy().getUsername() : null,
                task.getActive(),
                total,
                completed
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LmsTask> updateTask(@PathVariable Long id, @RequestBody UpdateTaskRequest request) {
        LmsTask task = lmsTaskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        User currentUser = teacherAccessService.requireCurrentUser();
        if (!"PRINCIPAL".equals(currentUser.getRole().name()) && task.getCreatedBy() != null) {
            if (!task.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this task");
            }
        }

        if (request.title() == null || request.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }

        task.setTitle(request.title());
        task.setDescription(request.description());
        if (request.dueDate() != null && !request.dueDate().isBlank()) {
            task.setDueDate(LocalDate.parse(request.dueDate()));
        } else {
            task.setDueDate(null);
        }
        lmsTaskRepository.save(task);
        return ResponseEntity.ok(task);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        LmsTask task = lmsTaskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        User currentUser = teacherAccessService.requireCurrentUser();
        if (!"PRINCIPAL".equals(currentUser.getRole().name()) && task.getCreatedBy() != null) {
            if (!task.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this task");
            }
        }

        task.setActive(false);
        lmsTaskRepository.save(task);
        return ResponseEntity.noContent().build();
    }

    private TaskAssignmentResponse toAssignmentResponse(TaskAssignment ta) {
        LmsTask t = ta.getTask();
        Student s = ta.getStudent();
        return new TaskAssignmentResponse(
                ta.getId(),
                t.getId(),
                t.getTitle(),
                t.getDescription(),
                t.getDueDate() != null ? t.getDueDate().toString() : null,
                t.getCourse() != null ? t.getCourse().getId() : null,
                t.getCourse() != null ? t.getCourse().getTitle() : null,
                s.getId(),
                s.getFullName(),
                s.getRollNumber(),
                ta.getStatus(),
                ta.getAssignedAt() != null ? ta.getAssignedAt().toString() : null,
                ta.getCompletedAt() != null ? ta.getCompletedAt().toString() : null
        );
    }
}
