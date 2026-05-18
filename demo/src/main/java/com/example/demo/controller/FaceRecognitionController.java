package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.FaceData;
import com.example.demo.service.FaceRecognitionService;

import java.util.List;

@RestController
public class FaceRecognitionController {

    private final FaceRecognitionService faceRecognitionService;

    public FaceRecognitionController(FaceRecognitionService faceRecognitionService) {
        this.faceRecognitionService = faceRecognitionService;
    }

    @PostMapping("/api/attendance/face-recognition")
    public ResponseEntity<List<FaceRecognitionService.RecognizedStudentDTO>> recognizeMultipleFaces(@RequestBody MultipleFaceRecognitionRequest request) {
        if (request.descriptors() == null || request.descriptors().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        List<FaceRecognitionService.RecognizedStudentDTO> results = faceRecognitionService.recognizeMultipleFaces(request.descriptors());
        return ResponseEntity.ok(results);
    }

    @PostMapping("/face/register")
    public ResponseEntity<FaceRegisterResponse> registerFace(@RequestBody FaceRegisterRequest request) {
        FaceData faceData = faceRecognitionService.registerFace(request.rollNumber(), request.descriptor());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new FaceRegisterResponse(faceData.getStudent().getRollNumber(), faceData.getStudent().getId(), "REGISTERED"));
    }

    @PostMapping("/face/recognize")
    public ResponseEntity<FaceRecognitionResponse> recognizeFace(@RequestBody FaceRecognitionRequest request) {
        if (request.rollNumber() == null || request.rollNumber().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new FaceRecognitionResponse(false, null, null, false, "Roll number is required."));
        }

        FaceRecognitionService.FaceRecognitionResult result = faceRecognitionService.recognizeFace(request.descriptor(), request.rollNumber());
        if (!result.matched()) {
            return ResponseEntity.ok(new FaceRecognitionResponse(false, null, null, false, "No face match found."));
        }

        if (!result.rollNumberMatched()) {
            return ResponseEntity.ok(new FaceRecognitionResponse(false, result.detectedRollNumber(), result.student().getId(), false,
                    "Face does not match the entered Roll Number. Expected: " + request.rollNumber() + ", Detected: " + result.detectedRollNumber()));
        }

        return ResponseEntity.ok(new FaceRecognitionResponse(
                true,
                result.student().getRollNumber(),
                result.student().getId(),
                result.attendanceMarked(),
                result.attendanceMarked() ? "Attendance recorded." : "Attendance already marked for today."));
    }

    public record FaceRegisterRequest(String rollNumber, double[] descriptor) {}
    public record FaceRegisterResponse(String rollNumber, Long studentId, String status) {}
    public record FaceRecognitionRequest(String rollNumber, double[] descriptor) {}
    public record FaceRecognitionResponse(boolean matched, String rollNumber, Long studentId, boolean attendanceMarked, String message) {}
    public record MultipleFaceRecognitionRequest(List<double[]> descriptors) {}
}
