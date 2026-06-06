package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(
    name = "quiz_assignments",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"quiz_id", "student_id"})
    }
)
public class QuizAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id")
    private Student student;

    private LocalDateTime assignedAt = LocalDateTime.now();
}
