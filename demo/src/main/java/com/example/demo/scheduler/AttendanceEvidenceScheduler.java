package com.example.demo.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.demo.service.AttendanceEvidenceService;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class AttendanceEvidenceScheduler {

    private final AttendanceEvidenceService evidenceService;

    public AttendanceEvidenceScheduler(AttendanceEvidenceService evidenceService) {
        this.evidenceService = evidenceService;
    }

    @Scheduled(cron = "0 0 * * * *")
    public void cleanupExpiredEvidence() {
        log.info("=== [SCHEDULER] Running expired attendance evidence cleanup ===");
        try {
            evidenceService.cleanupExpiredEvidence();
            log.info("=== [SCHEDULER] Attendance evidence cleanup completed successfully ===");
        } catch (Exception ex) {
            log.error("=== [SCHEDULER] An error occurred during attendance evidence cleanup ===", ex);
        }
    }
}
