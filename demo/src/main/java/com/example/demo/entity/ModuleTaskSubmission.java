package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class ModuleTaskSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_task_id")
    private ModuleTask moduleTask;

    @Column(columnDefinition = "TEXT")
    private String code;

    private Integer score;
    private String status; // PASS, FAIL, PENDING, ERROR

    @Column(columnDefinition = "TEXT")
    private String feedback;

    private LocalDateTime submittedAt = LocalDateTime.now();

    private String codeHash;
    private Long executionTimeMs;
}
