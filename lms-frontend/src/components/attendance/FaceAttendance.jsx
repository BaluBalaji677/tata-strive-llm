import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { clearAuth } from "../../utils/token";
import { registerFace, recognizeFace, recognizeMultipleFaces } from "../../api/attendanceApi";
import CameraPermissionModal from "./CameraPermissionModal";
import SuccessAttendanceModal from "./SuccessAttendanceModal";

const MODEL_URL = "/models";
const STATUS_RESET_DELAY = 3000;

function FaceAttendance() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const statusTimeoutRef = useRef(null);
  const localFaceCache = useRef([]); // { descriptor: Array, timestamp: number }
  const CACHE_EXPIRY_MS = 15000;

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
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
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
      const message = `Face registered for ${data.rollNumber} ✅`;
      setLastResult({ type: "success", message });
      setSuccessMessage(message);
      setShowSuccessModal(true);
      updateStatus(message, "success", false);
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

      if (data && data.length > 0) {
        setRecognizedStudents(data);
        const presentCount = data.filter(s => s.status === "Present" || s.status === "Already Marked").length;
        const message = `Successfully identified ${presentCount} student(s) ✅`;
        
        setLastResult({ type: "success", message });
        setSuccessMessage(message);
        setShowSuccessModal(true);
        updateStatus(message, "success", false);
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
        onClose={() => setShowSuccessModal(false)}
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
                className="relative z-10 h-80 w-full rounded-[20px] bg-slate-950 object-cover"
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
