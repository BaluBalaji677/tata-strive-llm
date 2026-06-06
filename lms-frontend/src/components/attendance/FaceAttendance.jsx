import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { clearAuth } from "../../utils/token";
import { registerFace, recognizeFace, recognizeMultipleFaces, uploadAttendanceEvidence } from "../../api/attendanceApi";
import CameraPermissionModal from "./CameraPermissionModal";
import SuccessAttendanceModal from "./SuccessAttendanceModal";
import FaceOverlayCanvas from "./FaceOverlayCanvas";
import CameraStatusBadge from "./CameraStatusBadge";
import DetectionPanel from "./DetectionPanel";

const MODEL_URL = "/models";
const STATUS_RESET_DELAY = 3000;

function FaceAttendance({ onAttendanceMarked }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const statusTimeoutRef = useRef(null);
  const localFaceCache = useRef([]); // { descriptor: Array, timestamp: number }
  const CACHE_EXPIRY_MS = 15000;

  // Live detection variables
  const detectionLoopRef = useRef(null);
  const lastDetectionTimeRef = useRef(0);
  const DETECTION_THROTTLE_MS = 200; // Run detection every 200ms

  const faceTrackerIdRef = useRef(0);
  const faceTrackersRef = useRef(new Map());
  const recognitionInFlightRef = useRef(false);

  const TRACKER_EXPIRY_MS = 2500;
  const RECOGNITION_CACHE_MS = 10000;
  const MATCH_DESCRIPTOR_THRESHOLD = 0.65;
  const MATCH_CENTER_THRESHOLD = 120;
  const DESCRIPTOR_CHANGE_THRESHOLD = 0.55;

  const [loadingModels, setLoadingModels] = useState(true);
  const [status, setStatus] = useState({ message: "Loading face recognition models...", type: "info" });
  const [rollNumber, setRollNumber] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("idle"); // "idle" | "granted" | "denied" | "blocked"
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [recognizedStudents, setRecognizedStudents] = useState([]);

  // Live detection state
  const [trackedFaces, setTrackedFaces] = useState([]);
  const [lastDetectionUpdateTime, setLastDetectionUpdateTime] = useState(null);
  const [isDetectionProcessing, setIsDetectionProcessing] = useState(false);

  const updateStatus = (message, type = "info", autoClear = false) => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }

    setStatus({ message, type });

    if (autoClear && message) {
      statusTimeoutRef.current = setTimeout(() => {
        setStatus({ message: "", type: "info" });
        statusTimeoutRef.current = null;
      }, STATUS_RESET_DELAY);
    }
  };

  const getCenter = (box) => ({
    x: box.x + box.width * 0.5,
    y: box.y + box.height * 0.5,
  });

  const getEuclideanDistance = (a, b) => {
    if (!a || !b || a.length !== b.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < a.length; i += 1) {
      const delta = a[i] - b[i];
      sum += delta * delta;
    }
    return Math.sqrt(sum);
  };

  const getBoxDistance = (boxA, boxB) => {
    if (!boxA || !boxB) return Infinity;
    const centerA = getCenter(boxA);
    const centerB = getCenter(boxB);
    return Math.hypot(centerA.x - centerB.x, centerA.y - centerB.y);
  };

  const createTracker = (detection) => {
    const descriptor = detection.descriptor ? Array.from(detection.descriptor) : [];
    const box = {
      x: detection.detection.box.x,
      y: detection.detection.box.y,
      width: detection.detection.box.width,
      height: detection.detection.box.height,
    };

    faceTrackerIdRef.current += 1;

    return {
      trackingId: faceTrackerIdRef.current,
      box,
      targetBox: { ...box },
      displayBox: { ...box },
      descriptor,
      lastSeen: Date.now(),
      lastDescriptorUpdate: Date.now(),
      lastRecognizedAt: 0,
      pendingRecognition: false,
      needsRecognition: true,
      recognition: {
        trackingId: faceTrackerIdRef.current,
        rollNumber: "UNKNOWN",
        studentName: "Unknown Face",
        confidence: undefined,
        status: "Unknown",
        lastSeen: Date.now(),
      },
    };
  };

  const updateTrackersFromDetections = (detections) => {
    const now = Date.now();
    const existingTrackers = Array.from(faceTrackersRef.current.values());
    const candidateTrackers = existingTrackers.filter((tracker) => now - tracker.lastSeen <= TRACKER_EXPIRY_MS);

    const matches = [];
    detections.forEach((detection, detectionIndex) => {
      const detectionDescriptor = detection.descriptor ? Array.from(detection.descriptor) : null;
      const detectionBox = detection.detection.box;

      candidateTrackers.forEach((tracker) => {
        const centerDistance = getBoxDistance(detectionBox, tracker.box);
        const descriptorDistance = detectionDescriptor ? getEuclideanDistance(detectionDescriptor, tracker.descriptor) : Infinity;
        const score = descriptorDistance === Infinity ? centerDistance / 100 : descriptorDistance + centerDistance * 0.003;

        matches.push({ detectionIndex, trackerId: tracker.trackingId, score, descriptorDistance, centerDistance });
      });
    });

    matches.sort((a, b) => a.score - b.score);

    const assignedTrackers = new Set();
    const assignedDetections = new Set();
    const detectionToTracker = new Map();

    matches.forEach((match) => {
      if (assignedTrackers.has(match.trackerId) || assignedDetections.has(match.detectionIndex)) {
        return;
      }

      if (match.descriptorDistance < MATCH_DESCRIPTOR_THRESHOLD || match.centerDistance < MATCH_CENTER_THRESHOLD) {
        assignedTrackers.add(match.trackerId);
        assignedDetections.add(match.detectionIndex);
        detectionToTracker.set(match.detectionIndex, match.trackerId);
      }
    });

    const updatedTrackers = new Map(faceTrackersRef.current);

    detections.forEach((detection, detectionIndex) => {
      const descriptor = detection.descriptor ? Array.from(detection.descriptor) : [];
      const box = {
        x: detection.detection.box.x,
        y: detection.detection.box.y,
        width: detection.detection.box.width,
        height: detection.detection.box.height,
      };

      if (detectionToTracker.has(detectionIndex)) {
        const trackerId = detectionToTracker.get(detectionIndex);
        const tracker = updatedTrackers.get(trackerId);
        if (!tracker) return;

        const descriptorDistance = getEuclideanDistance(descriptor, tracker.descriptor);
        const descriptorChanged = descriptorDistance > DESCRIPTOR_CHANGE_THRESHOLD;

        tracker.box = box;
        tracker.targetBox = { ...box };
        tracker.descriptor = descriptor;
        tracker.lastSeen = now;
        tracker.lastDescriptorUpdate = now;
        tracker.needsRecognition = tracker.needsRecognition || descriptorChanged || now - tracker.lastRecognizedAt >= RECOGNITION_CACHE_MS;
        tracker.pendingRecognition = false;
        tracker.recognition.lastSeen = now;
      } else {
        const newTracker = createTracker(detection);
        updatedTrackers.set(newTracker.trackingId, newTracker);
      }
    });

    Array.from(updatedTrackers.values()).forEach((tracker) => {
      if (now - tracker.lastSeen > TRACKER_EXPIRY_MS) {
        updatedTrackers.delete(tracker.trackingId);
      }
    });

    faceTrackersRef.current = updatedTrackers;
    const activeTrackers = Array.from(updatedTrackers.values());
    setTrackedFaces(activeTrackers);

    return activeTrackers.filter((tracker) => tracker.needsRecognition && !tracker.pendingRecognition);
  };

  const processRecognitionQueue = async (trackersToRecognize) => {
    if (recognitionInFlightRef.current || trackersToRecognize.length === 0) {
      return;
    }

    recognitionInFlightRef.current = true;
    trackersToRecognize.forEach((tracker) => {
      tracker.pendingRecognition = true;
    });

    try {
      const response = await recognizeMultipleFaces({
        descriptors: trackersToRecognize.map((tracker) => tracker.descriptor),
      });

      if (!Array.isArray(response)) {
        throw new Error("Invalid face recognition response");
      }

      trackersToRecognize.forEach((tracker, index) => {
        const result = response[index] || {};
        tracker.recognition = {
          trackingId: tracker.trackingId,
          rollNumber: result.rollNumber || "UNKNOWN",
          studentName: result.name || result.studentName || "Unknown Face",
          confidence: result.distance !== undefined ? Math.max(0, 1 - result.distance) : undefined,
          status: result.status || "UNKNOWN",
          lastSeen: Date.now(),
        };
        tracker.lastRecognizedAt = Date.now();
        tracker.pendingRecognition = false;
        tracker.needsRecognition = false;
      });

      setTrackedFaces(Array.from(faceTrackersRef.current.values()));
    } catch (error) {
      console.error("Recognition queue failed:", error);
    } finally {
      recognitionInFlightRef.current = false;
      trackersToRecognize.forEach((tracker) => {
        tracker.pendingRecognition = false;
      });
    }
  };

  const startLiveDetectionLoop = async () => {
    if (!videoRef.current || !isCameraActive) {
      return;
    }

    const now = Date.now();
    if (now - lastDetectionTimeRef.current < DETECTION_THROTTLE_MS) {
      detectionLoopRef.current = requestAnimationFrame(startLiveDetectionLoop);
      return;
    }

    lastDetectionTimeRef.current = now;
    setIsDetectionProcessing(true);

    try {
      const detections = await faceapi
        .detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      const recognitionCandidates = updateTrackersFromDetections(detections || []);
      setLastDetectionUpdateTime(new Date());
      processRecognitionQueue(recognitionCandidates);
    } catch (error) {
      console.debug("Live detection error (non-critical):", error?.message || error);
      faceTrackersRef.current = new Map();
      setTrackedFaces([]);
    } finally {
      setIsDetectionProcessing(false);
      detectionLoopRef.current = requestAnimationFrame(startLiveDetectionLoop);
    }
  };

  const stopLiveDetectionLoop = () => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    setTrackedFaces([]);
    setLastDetectionUpdateTime(null);
    setIsDetectionProcessing(false);
  };

  useEffect(() => {
    if (isCameraActive) {
      startLiveDetectionLoop();
    } else {
      stopLiveDetectionLoop();
    }

    return () => stopLiveDetectionLoop();
  }, [isCameraActive]);

  useEffect(() => {
    let mounted = true;

    const loadModels = async () => {
      try {
        updateStatus("Downloading face recognition models...");
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

        if (mounted) {
          setLoadingModels(false);
          updateStatus("Models loaded. Click Start Camera to begin.", "success");
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setLoadingModels(false);
          updateStatus("Unable to load face recognition models. Make sure /models is available.", "error");
        }
      }
    };

    loadModels();

    return () => {
      mounted = false;
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      stopLiveDetectionLoop();
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    console.log("[Attendance SUCCESS] Stopping camera...");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      console.log("[Attendance SUCCESS] Stopped all active MediaStream tracks");
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      console.log("[Attendance SUCCESS] Cleared video stream references");
    }

    setIsCameraActive(false);
    console.log("[Attendance SUCCESS] Camera stopped");
  };

  const startCamera = async () => {
    if (loadingModels) {
      updateStatus("Please wait for the face models to finish loading.", "warning", true);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      updateStatus("No camera is available in this browser or device. ❌", "error", true);
      setCameraStatus("blocked");
      return;
    }

    try {
      if (streamRef.current) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      setCameraStatus("granted");
      setLastResult(null);
      updateStatus("Camera started successfully ✅", "success", true);
    } catch (cameraError) {
      console.error(cameraError);

      if (cameraError?.name === "NotAllowedError" || cameraError?.name === "PermissionDeniedError") {
        setCameraStatus("denied");
        updateStatus("Camera permission denied. Click retry or check browser settings. ❌", "error", true);
        return;
      }

      if (cameraError?.name === "NotFoundError" || cameraError?.name === "DevicesNotFoundError") {
        setCameraStatus("blocked");
        updateStatus("No camera found on this device ❌", "error", true);
        return;
      }

      setCameraStatus("blocked");
      updateStatus("Unable to start camera right now. Please try again. ❌", "error", true);
    }
  };

  const captureFaceDescriptor = async () => {
    setLastResult(null);

    if (!videoRef.current || !streamRef.current) {
      updateStatus("Start the camera before scanning a face.", "error", true);
      return null;
    }

    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection || !detection.descriptor) {
      updateStatus("Face not detected. Please align your face inside the frame ❌", "error", true);
      return null;
    }

    return Array.from(detection.descriptor);
  };

  const captureAllFaceDescriptors = async () => {
    setLastResult(null);

    if (!videoRef.current || !streamRef.current) {
      updateStatus("Start the camera before scanning faces.", "error", true);
      return null;
    }

    updateStatus("Performing liveness check...");
    // Capture Frame 1
    const detections1 = await faceapi
      .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections1 || detections1.length === 0) {
      updateStatus("No faces detected in the frame ❌", "error", true);
      return null;
    }

    // Wait 300ms for small movement
    await new Promise(resolve => setTimeout(resolve, 300));

    // Capture Frame 2
    const detections2 = await faceapi
      .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections2 || detections2.length === 0) {
      updateStatus("Faces lost during liveness check ❌", "error", true);
      return null;
    }

    // Liveness check: For each face in frame 1, check if movement > 1 pixel in frame 2
    let isLive = true;
    for (const d1 of detections1) {
      const match = detections2.find(d2 => {
        const dx = d1.detection.box.x - d2.detection.box.x;
        const dy = d1.detection.box.y - d2.detection.box.y;
        return Math.sqrt(dx * dx + dy * dy) < 50; // Match same face roughly
      });

      if (match) {
        const dx = Math.abs(d1.detection.box.x - match.detection.box.x);
        const dy = Math.abs(d1.detection.box.y - match.detection.box.y);
        
        // If movement is extremely small, it might be a static photo
        if (dx < 1.0 && dy < 1.0) {
          isLive = false;
          break;
        }
      }
    }

    if (!isLive) {
      updateStatus("Liveness check failed! Static photo detected. ❌", "error", true);
      return null;
    }

    return detections2.map(d => Array.from(d.descriptor));
  };

  const captureEvidenceImage = () => {
    if (!videoRef.current) {
      return null;
    }

    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const handleSessionExpired = () => {
    clearAuth();
    updateStatus("Session expired. Please login again.", "error");
    window.location.href = "/login";
  };

  const handleRegister = async () => {
    if (!rollNumber?.trim()) {
      updateStatus("Enter a roll number before registering a face.", "error", true);
      return;
    }

    setIsRegistering(true);
    setLastResult(null);
    updateStatus("Detecting face for registration...");

    try {
      const descriptor = await captureFaceDescriptor();
      if (!descriptor) {
        return;
      }

      updateStatus("Registering face descriptor...");
      const data = await registerFace({ rollNumber: rollNumber.trim(), descriptor });
      console.log("[Attendance SUCCESS] Attendance success response received:", data);
      const message = `Face registered for ${data.rollNumber} ✅`;
      setLastResult({ type: "success", message });
      setSuccessMessage(message);
      console.log("[Attendance SUCCESS] Success modal opened");
      setShowSuccessModal(true);
      updateStatus(message, "success", false);
      if (onAttendanceMarked) {
        onAttendanceMarked();
      }
    } catch (registerError) {
      console.error(registerError);
      if (registerError?.status === 401 || registerError?.response?.status === 401) {
        handleSessionExpired();
        return;
      }

      const message = registerError?.message || "Failed to register face ❌";
      setLastResult({ type: "error", message });
      updateStatus(message, "error", true);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRecognize = async () => {
    setIsRecognizing(true);
    setLastResult(null);
    setRecognizedStudents([]);
    updateStatus("Detecting faces for recognition...");

    try {
      const startTime = performance.now();
      const descriptors = await captureAllFaceDescriptors();
      if (!descriptors) {
        return;
      }

      // Clean up expired cache
      const now = Date.now();
      localFaceCache.current = localFaceCache.current.filter(c => now - c.timestamp <= CACHE_EXPIRY_MS);

      // Filter out recently processed faces to prevent spamming the API
      const filteredDescriptors = [];
      for (const desc of descriptors) {
        const isRecentlyProcessed = localFaceCache.current.some(cached => {
          let sum = 0;
          for (let i = 0; i < desc.length; i++) {
            sum += Math.pow(desc[i] - cached.descriptor[i], 2);
          }
          return Math.sqrt(sum) < 0.4; // Euclidean distance < 0.4 means very likely the exact same face
        });

        if (!isRecentlyProcessed) {
          filteredDescriptors.push(desc);
          localFaceCache.current.push({ descriptor: desc, timestamp: now });
        }
      }

      if (filteredDescriptors.length === 0) {
        updateStatus("These faces were already processed recently. Please wait before scanning again.", "warning", true);
        return;
      }

      console.log(`Sending ${filteredDescriptors.length} new face(s) to API...`);
      updateStatus(`Found ${filteredDescriptors.length} new face(s). Recognizing...`);
      
      const data = await recognizeMultipleFaces({ descriptors: filteredDescriptors });
      const apiTime = Math.round(performance.now() - startTime);
      console.log(`API response received in ${apiTime}ms`);

      const sessionId = window.crypto?.randomUUID?.() || `attendance-session-${Date.now()}`;
      const evidenceImage = captureEvidenceImage();

      if (data && data.length > 0) {
        console.log("[Attendance SUCCESS] Attendance success response received:", data);
        setRecognizedStudents(data);
        const presentCount = data.filter(s => s.status === "Present" || s.status === "Already Marked").length;
        const message = `Successfully identified ${presentCount} student(s) ✅`;
        
        setLastResult({ type: "success", message });
        setSuccessMessage(message);
        console.log("[Attendance SUCCESS] Success modal opened");
        setShowSuccessModal(true);
        updateStatus(message, "success", false);
        if (onAttendanceMarked && data) {
          const todayStr = new Date().toLocaleDateString('en-CA');
          const newRecords = data
            .filter(s => s.status === "Present" || s.status === "Already Marked")
            .map((s, idx) => ({
              id: `face-${Date.now()}-${idx}`,
              date: todayStr,
              present: true,
              rollNumber: s.rollNumber,
              studentName: s.studentName || s.name || "Unknown"
            }));
          onAttendanceMarked(newRecords);
        }

        if (evidenceImage) {
          uploadAttendanceEvidence({ imageBase64: evidenceImage, attendanceSessionId: sessionId })
            .then(() => {
              console.debug("Attendance evidence uploaded successfully");
            })
            .catch((uploadError) => {
              console.warn("Attendance evidence upload failed:", uploadError);
            });
        }
      } else {
        const message = "No matching faces found in the database ❌";
        setLastResult({ type: "error", message: "None of the detected faces match our records." });
        updateStatus(message, "error", true);
      }
    } catch (recognizeError) {
      console.error(recognizeError);
      if (recognizeError?.status === 401 || recognizeError?.response?.status === 401) {
        handleSessionExpired();
        return;
      }

      const message = recognizeError?.message || "Face recognition failed ❌";
      setLastResult({ type: "error", message });
      updateStatus(message, "error", true);
    } finally {
      setIsRecognizing(false);
    }
  };

  const statusStyles = {
    success: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
    error: "border-rose-400/40 bg-rose-500/15 text-rose-100",
    warning: "border-amber-400/40 bg-amber-500/15 text-amber-100",
    info: "border-white/15 bg-white/5 text-slate-100",
  };

  const handleCloseSuccessModal = () => {
    console.log("[Attendance SUCCESS] Success modal closed");

    stopCamera();

    setShowSuccessModal(false);
    setIsRecognizing(false);
    setIsRegistering(false);
    setRecognizedStudents([]);
    setStatus({ message: "Ready to start attendance", type: "success" });

    console.log("[Attendance SUCCESS] Dashboard state restored");
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Camera Permission Modal */}
      <CameraPermissionModal 
        cameraStatus={cameraStatus} 
        onRetry={startCamera}
        onClose={() => setCameraStatus("idle")}
      />

      {/* Success Modal */}
      <SuccessAttendanceModal
        isVisible={showSuccessModal}
        message={successMessage}
        rollNumber={rollNumber}
        onClose={handleCloseSuccessModal}
      />

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex w-fit items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                Smart Attendance
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Face Recognition Attendance
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
                  Start the camera only when you are ready, then register or recognize a face without disrupting the
                  existing attendance workflow.
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Step 1</p>
                <p className="mt-1 font-medium text-white">Load models</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Step 2</p>
                <p className="mt-1 font-medium text-white">Start camera</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Step 3</p>
                <p className="mt-1 font-medium text-white">Mark attendance</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.98))] px-6 py-6 sm:px-8 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-slate-900/80 p-3 shadow-inner shadow-slate-950/40">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_35%)]" />
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="relative z-0 h-80 w-full rounded-[20px] bg-slate-950 object-cover"
              />

              <FaceOverlayCanvas
                videoRef={videoRef}
                trackedFaces={trackedFaces}
                isCameraActive={isCameraActive}
              />

              <CameraStatusBadge
                isCameraActive={isCameraActive}
                isLoadingModels={loadingModels}
                faceCount={trackedFaces.length}
              />

              {!isCameraActive ? (
                <div className="absolute inset-3 z-20 flex flex-col items-center justify-center rounded-[20px] border border-dashed border-white/10 bg-slate-950/70 px-6 text-center backdrop-blur-sm">
                  <div className="max-w-sm space-y-3">
                    <p className="text-lg font-semibold text-white">Camera is idle</p>
                    <p className="text-sm leading-6 text-slate-300">
                      No video is captured on page load. Click Start Camera when you are ready to scan a face.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 backdrop-blur-md">
                {isCameraActive
                  ? "Camera is live. Use Register Face or Recognize & Mark below."
                  : "Models are ready. Camera access waits for your click."}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={startCamera}
                disabled={loadingModels || isCameraActive}
                className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {loadingModels ? "Preparing..." : isCameraActive ? "Camera Started" : "Start Camera"}
              </button>
              <button
                type="button"
                disabled={loadingModels || !isCameraActive || isRegistering}
                onClick={handleRegister}
                className="rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-900/50 disabled:text-emerald-100/60"
              >
                {isRegistering ? "Registering..." : "Register Face"}
              </button>
              <button
                type="button"
                disabled={loadingModels || !isCameraActive || isRecognizing}
                onClick={handleRecognize}
                className="rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-950/60 disabled:text-cyan-100/60"
              >
                {isRecognizing ? "Scanning..." : "Scan Frame for Attendance"}
              </button>
            </div>

            {status.message ? (
              <div
                className={`rounded-2xl border px-4 py-4 text-center text-sm font-medium shadow-lg shadow-slate-950/20 transition-all duration-300 ${statusStyles[status.type]}`}
              >
                {status.message}
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <label className="mb-3 block text-sm font-medium text-slate-300">Registration Roll Number</label>
              <input
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Roll Number (Only for Registration)"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
              />
              <p className="mt-2 text-xs text-slate-400">Roll number is only needed when registering a new face. Scanning for attendance does not require a roll number.</p>
            </div>

            <DetectionPanel
              trackedFaces={trackedFaces}
              isProcessing={isDetectionProcessing || isRecognizing}
              lastUpdateTime={lastDetectionUpdateTime}
            />

            {recognizedStudents.length > 0 && (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                <p className="text-sm font-semibold text-white">Recognized Students</p>
                <div className="mt-4 space-y-3">
                  {recognizedStudents.map((student, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div>
                        <p className="text-sm font-medium text-white">{student.name}</p>
                        <p className="text-xs text-slate-400">
                          {student.rollNumber !== 'UNKNOWN' ? student.rollNumber : 'Not Recognized'}
                          {student.distance !== undefined && ` • Conf: ${Math.round(Math.max(0, 1 - student.distance) * 100)}%`}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        student.status === 'Present' ? 'bg-emerald-500/20 text-emerald-400' :
                        student.status === 'Already Marked' ? 'bg-cyan-500/20 text-cyan-400' :
                        student.status === 'UNKNOWN' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {student.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <p className="text-sm font-semibold text-white">Session Feedback</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Current state</p>
                  <p className="mt-2 text-sm text-slate-200">
                    {loadingModels
                      ? "Loading face models..."
                      : isCameraActive
                        ? "Camera active and ready for face scanning."
                        : "Waiting for you to start the camera."}
                  </p>
                </div>

                {lastResult ? (
                  <div
                    className={`rounded-2xl border p-4 text-sm ${
                      lastResult.type === "success"
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                        : "border-rose-400/30 bg-rose-500/10 text-rose-100"
                    }`}
                  >
                    {lastResult.message}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <p className="text-sm font-semibold text-white">How it works</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <p>1. Let the face models load fully.</p>
                <p>2. Click Start Camera to request browser permission.</p>
                <p>3. Register a new face or recognize an existing one to mark attendance.</p>
                <p>4. Success and error messages appear clearly, then reset automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FaceAttendance;
