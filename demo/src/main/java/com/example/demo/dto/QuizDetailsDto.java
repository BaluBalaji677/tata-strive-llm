package com.example.demo.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizDetailsDto {
    private Long id;
    private String title;
    private String description;
    private Long courseId;
    private String courseTitle;
    private List<QuestionDto> questions;
    private Boolean allowMultipleSubmissions;
}
