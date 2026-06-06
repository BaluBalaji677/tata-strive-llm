package com.example.demo.dto;

import java.util.List;

public record PrincipalPageResponseDTO<T>(
        List<T> content,
        int totalPages,
        long totalElements,
        int size,
        int number
) {
}
