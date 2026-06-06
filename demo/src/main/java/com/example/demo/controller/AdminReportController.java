package com.example.demo.controller;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.AttendanceReportService;

@RestController
@RequestMapping("/admin/attendance/report")
@PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
public class AdminReportController {

    private final AttendanceReportService attendanceReportService;
    private final UserRepository userRepository;

    public AdminReportController(AttendanceReportService attendanceReportService, UserRepository userRepository) {
        this.attendanceReportService = attendanceReportService;
        this.userRepository = userRepository;
    }

    /**
     * Downloads the today's attendance report Excel file.
     * @return ResponseEntity with the Excel file as attachment
     */
    @GetMapping("/today")
    public ResponseEntity<Resource> downloadTodayReport() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        User currentUser = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        LocalDate today = LocalDate.now();
        String fileName = "attendance_" + today.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".xlsx";

        byte[] reportBytes = attendanceReportService.generateTodayReportForUser(currentUser);
        Resource resource = new ByteArrayResource(reportBytes);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(resource);
    }
}