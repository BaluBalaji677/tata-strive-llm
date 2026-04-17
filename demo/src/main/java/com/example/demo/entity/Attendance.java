package com.example.demo.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "attendance")
@Getter
@Setter
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // We hide student details from JSON responses.
    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id", referencedColumnName = "id", nullable = false)
    @JsonIgnore
    private Student student;

    // One attendance record per student per date.
    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private boolean present;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "marked_by_admin", nullable = false)
    private boolean markedByAdmin;

    // Stored as "PRESENT"/"ABSENT" for compatibility with existing DB.
    @Column(nullable = false)
    private String status;

    // Optional in this Phase 6; if your DB requires it, set it in admin flow later.
    @ManyToOne
    @JoinColumn(name = "course_day_id")
    private CourseDay courseDay;
}