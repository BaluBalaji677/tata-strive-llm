package com.example.demo.service.impl;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.Student;
import com.example.demo.repository.AttendanceRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.service.AttendanceReportService;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AttendanceReportServiceImpl implements AttendanceReportService {

    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;

    public AttendanceReportServiceImpl(StudentRepository studentRepository, AttendanceRepository attendanceRepository) {
        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public void generateDailyReport() {
        log.info("Generating attendance report...");

        List<Student> students = studentRepository.findAll();
        LocalDate today = LocalDate.now();
        String fileName = "attendance_" + today.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".xlsx";
        String reportsDir = "reports";
        String filePath = reportsDir + File.separator + fileName;

        // Create reports directory if it doesn't exist
        File dir = new File(reportsDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Attendance Report");

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Student ID", "Name", "Today Status", "Total Present", "Total Absent", "Percentage"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            int rowNum = 1;
            for (Student student : students) {
                Row row = sheet.createRow(rowNum++);

                // Student ID
                row.createCell(0).setCellValue(student.getRollNumber());

                // Name
                row.createCell(1).setCellValue(student.getFullName() != null ? student.getFullName() : "");

                // Today Status
                String todayStatus = getTodayStatus(student, today);
                row.createCell(2).setCellValue(todayStatus);

                // Calculate metrics
                long totalPresent = attendanceRepository.countByStudentAndPresentTrue(student);
                long totalAbsent = attendanceRepository.countByStudent(student) - totalPresent;
                double percentage = calculatePercentage(totalPresent, totalPresent + totalAbsent);

                // Total Present
                row.createCell(3).setCellValue(totalPresent);

                // Total Absent
                row.createCell(4).setCellValue(totalAbsent);

                // Percentage
                row.createCell(5).setCellValue(String.format("%.2f%%", percentage));
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write to file
            try (FileOutputStream fos = new FileOutputStream(filePath)) {
                workbook.write(fos);
            }

            log.info("Report generated successfully: {}", filePath);

        } catch (IOException e) {
            log.error("Error generating attendance report", e);
            throw new RuntimeException("Failed to generate attendance report", e);
        }
    }

    private String getTodayStatus(Student student, LocalDate today) {
        return attendanceRepository.findByStudentAndDate(student, today)
                .map(attendance -> attendance.isPresent() ? "Present" : "Absent")
                .orElse("Absent"); // If no record, assume absent
    }

    private double calculatePercentage(long present, long total) {
        if (total == 0) {
            return 0.0;
        }
        return (present * 100.0) / total;
    }
}