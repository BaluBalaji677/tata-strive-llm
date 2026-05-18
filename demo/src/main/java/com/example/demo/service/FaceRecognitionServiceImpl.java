package com.example.demo.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.demo.entity.FaceData;
import com.example.demo.entity.Student;
import com.example.demo.repository.FaceDataRepository;
import com.example.demo.repository.StudentRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class FaceRecognitionServiceImpl implements FaceRecognitionService {

    private static final Logger logger = LoggerFactory.getLogger(FaceRecognitionServiceImpl.class);

    @Value("${face.recognition.threshold:0.55}")
    private double matchThreshold;

    private final FaceDataRepository faceDataRepository;
    private final StudentRepository studentRepository;
    private final AttendanceService attendanceService;
    private final ObjectMapper objectMapper;

    private final List<EnrolledFace> enrolledFacesCache = new CopyOnWriteArrayList<>();

    private record EnrolledFace(Student student, double[] descriptor) {}

    public FaceRecognitionServiceImpl(
            FaceDataRepository faceDataRepository,
            StudentRepository studentRepository,
            AttendanceService attendanceService
    ) {
        this.faceDataRepository = faceDataRepository;
        this.studentRepository = studentRepository;
        this.attendanceService = attendanceService;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public FaceData registerFace(String rollNumber, double[] descriptor) {
        if (rollNumber == null || rollNumber.isBlank()) {
            throw new RuntimeException("rollNumber is required for face registration");
        }
        if (descriptor == null || descriptor.length == 0) {
            throw new RuntimeException("Face descriptor is required");
        }

        Student student = studentRepository.findByRollNumber(rollNumber.trim())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        FaceData faceData = faceDataRepository.findByStudent(student).orElse(new FaceData());
        faceData.setStudent(student);
        faceData.setDescriptorJson(writeDescriptor(descriptor));
        FaceData saved = faceDataRepository.save(faceData);
        
        loadCache(); // Update cache on new registration
        return saved;
    }

    @PostConstruct
    public void loadCache() {
        logger.info("Loading face descriptors into memory cache...");
        List<FaceData> allFaces = faceDataRepository.findAll();
        enrolledFacesCache.clear();
        for (FaceData face : allFaces) {
            try {
                double[] desc = readDescriptor(face.getDescriptorJson());
                enrolledFacesCache.add(new EnrolledFace(face.getStudent(), desc));
            } catch (Exception e) {
                logger.error("Failed to load descriptor for student {}", face.getStudent().getRollNumber(), e);
            }
        }
        logger.info("Successfully cached {} face descriptors.", enrolledFacesCache.size());
    }

    @Override
    public FaceRecognitionResult recognizeFace(double[] descriptor, String enteredRollNumber) {
        if (descriptor == null || descriptor.length == 0) {
            throw new RuntimeException("Face descriptor is required for recognition");
        }

        if (enteredRollNumber == null || enteredRollNumber.isBlank()) {
            throw new RuntimeException("Entered roll number is required for validation");
        }

        if (enrolledFacesCache.isEmpty()) {
            return new FaceRecognitionResult(false, false, null, null, false, Double.MAX_VALUE);
        }

        EnrolledFace bestMatch = null;
        double bestDistance = Double.MAX_VALUE;

        for (EnrolledFace stored : enrolledFacesCache) {
            double[] storedDescriptor = stored.descriptor();
            if (storedDescriptor.length != descriptor.length) {
                continue;
            }

            double distance = computeEuclideanDistance(descriptor, storedDescriptor);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestMatch = stored;
            }
        }

        logger.debug("Recognize single face: best distance = {}", bestDistance);

        if (bestMatch == null || bestDistance > matchThreshold) {
            return new FaceRecognitionResult(false, false, null, null, false, bestDistance);
        }

        Student student = bestMatch.student();
        String detectedRollNumber = student.getRollNumber();
        boolean rollNumberMatched = enteredRollNumber.trim().equals(detectedRollNumber);

        // Only mark attendance if roll numbers match
        boolean attendanceMarked = false;
        if (rollNumberMatched) {
            try {
                attendanceService.markTodayAttendance(student.getRollNumber(), true);
                attendanceMarked = true;
            } catch (RuntimeException ex) {
                if (ex.getMessage() != null && ex.getMessage().contains("Attendance already marked")) {
                    attendanceMarked = false; // Already marked, but that's okay
                } else {
                    throw ex;
                }
            }
        }

        return new FaceRecognitionResult(true, rollNumberMatched, student, detectedRollNumber, attendanceMarked, bestDistance);
    }

    @Override
    public List<RecognizedStudentDTO> recognizeMultipleFaces(List<double[]> descriptors) {
        long startTime = System.currentTimeMillis();
        
        if (descriptors == null || descriptors.isEmpty()) {
            return new ArrayList<>();
        }

        if (enrolledFacesCache.isEmpty()) {
            return new ArrayList<>();
        }

        List<RecognizedStudentDTO> results = new ArrayList<>();

        for (double[] descriptor : descriptors) {
            EnrolledFace bestMatch = null;
            double bestDistance = Double.MAX_VALUE;

            for (EnrolledFace stored : enrolledFacesCache) {
                double[] storedDescriptor = stored.descriptor();
                if (storedDescriptor.length != descriptor.length) {
                    continue;
                }

                double distance = computeEuclideanDistance(descriptor, storedDescriptor);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = stored;
                }
            }

            logger.info("Recognize multiple faces: evaluated distance = {}", bestDistance);

            if (bestMatch != null && bestDistance <= matchThreshold) {
                Student student = bestMatch.student();
                String status = "Present";
                String message = "Attendance recorded.";
                boolean marked = false;

                try {
                    attendanceService.markTodayAttendance(student.getRollNumber(), true);
                    marked = true;
                } catch (RuntimeException ex) {
                    if (ex.getMessage() != null && ex.getMessage().contains("Attendance already marked")) {
                        status = "Already Marked";
                        message = "Attendance was already marked today.";
                        marked = true;
                    } else {
                        status = "Error";
                        message = ex.getMessage();
                    }
                }

                if (marked) {
                    results.add(new RecognizedStudentDTO(
                            student.getRollNumber(),
                            student.getFullName(),
                            status,
                            message,
                            bestDistance
                    ));
                }
            } else {
                results.add(new RecognizedStudentDTO(
                        "UNKNOWN",
                        "Unknown Face",
                        "UNKNOWN",
                        "Face not recognized.",
                        bestDistance
                ));
            }
        }

        long endTime = System.currentTimeMillis();
        logger.info("Recognized {} faces in {} ms", descriptors.size(), (endTime - startTime));

        return results;
    }

    private double computeEuclideanDistance(double[] a, double[] b) {
        double sum = 0.0;
        for (int i = 0; i < a.length; i++) {
            double diff = a[i] - b[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }

    private String writeDescriptor(double[] descriptor) {
        try {
            return objectMapper.writeValueAsString(descriptor);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Unable to serialize face descriptor", e);
        }
    }

    private double[] readDescriptor(String descriptorJson) {
        try {
            return objectMapper.readValue(descriptorJson, double[].class);
        } catch (IOException e) {
            throw new RuntimeException("Unable to deserialize face descriptor", e);
        }
    }
}
