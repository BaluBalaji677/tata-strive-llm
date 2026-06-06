package com.example.demo.service;

public interface AttendanceReportService {

    /**
     * Generates the daily attendance Excel report.
     * This method fetches all students, calculates their attendance metrics,
     * and creates an Excel file with the report.
     */
    void generateDailyReport();

    /**
     * Generates the daily attendance Excel report in memory for a specific user,
     * filtering students based on the user's role and ownership.
     * @param user The logged-in User
     * @return Byte array of the generated Excel workbook
     */
    byte[] generateTodayReportForUser(com.example.demo.entity.User user);
}