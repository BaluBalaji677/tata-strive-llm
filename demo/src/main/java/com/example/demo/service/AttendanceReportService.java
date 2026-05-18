package com.example.demo.service;

public interface AttendanceReportService {

    /**
     * Generates the daily attendance Excel report.
     * This method fetches all students, calculates their attendance metrics,
     * and creates an Excel file with the report.
     */
    void generateDailyReport();
}