package com.example.demo.controller;

import java.io.File;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/attendance/report")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    /**
     * Downloads the today's attendance report Excel file.
     * @return ResponseEntity with the Excel file as attachment
     */
    @GetMapping("/today")
    public ResponseEntity<Resource> downloadTodayReport() {
        LocalDate today = LocalDate.now();
        String fileName = "attendance_" + today.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".xlsx";
        String filePath = "reports" + File.separator + fileName;

        File file = new File(filePath);
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(resource);
    }
}