package com.example.demo.service;

import com.example.demo.entity.FaceData;
import com.example.demo.entity.Student;
import java.util.List;

public interface FaceRecognitionService {

    FaceData registerFace(String rollNumber, double[] descriptor);

    FaceRecognitionResult recognizeFace(double[] descriptor, String enteredRollNumber);

    List<RecognizedStudentDTO> recognizeMultipleFaces(List<double[]> descriptors);

    record FaceRecognitionResult(boolean matched, boolean rollNumberMatched, Student student, String detectedRollNumber, boolean attendanceMarked, double distance) {}
    
    record RecognizedStudentDTO(String rollNumber, String name, String status, String message, double distance) {}
}
