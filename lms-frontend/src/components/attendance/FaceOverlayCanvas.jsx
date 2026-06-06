import { useEffect, useRef } from "react";

const FaceOverlayCanvas = ({
  videoRef,
  trackedFaces = [],
  isCameraActive = false,
}) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const displayBoxesRef = useRef(new Map());

  const lerp = (start, end, alpha) => start + (end - start) * alpha;

  const smoothBox = (previous, target) => {
    if (!previous) {
      return { ...target };
    }

    return {
      x: lerp(previous.x, target.x, 0.22),
      y: lerp(previous.y, target.y, 0.22),
      width: lerp(previous.width, target.width, 0.22),
      height: lerp(previous.height, target.height, 0.22),
    };
  };

  const drawOverlay = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.videoWidth || !video.videoHeight) return;

    canvas.width = video.offsetWidth;
    canvas.height = video.offsetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    trackedFaces.forEach((tracker) => {
      const targetBox = tracker.targetBox || tracker.box;
      const previousBox = displayBoxesRef.current.get(tracker.trackingId);
      const displayBox = smoothBox(previousBox, targetBox);
      displayBoxesRef.current.set(tracker.trackingId, displayBox);

      const x = displayBox.x * scaleX;
      const y = displayBox.y * scaleY;
      const width = displayBox.width * scaleX;
      const height = displayBox.height * scaleY;

      const isRecognized = tracker.recognition?.rollNumber && tracker.recognition.rollNumber !== "UNKNOWN";
      const boxColor = isRecognized ? "rgba(52, 211, 153, 1)" : "rgba(250, 204, 21, 1)";
      const fillColor = isRecognized ? "rgba(52, 211, 153, 0.14)" : "rgba(250, 204, 21, 0.08)";
      const textBgColor = isRecognized ? "rgba(52, 211, 153, 0.25)" : "rgba(250, 204, 21, 0.25)";

      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = boxColor;
      ctx.shadowBlur = 8;
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, width, height);

      ctx.shadowColor = "transparent";
      ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const labelText = isRecognized
        ? `${tracker.recognition.studentName} (${tracker.recognition.rollNumber})`
        : "Unknown Face";
      const confidenceText = tracker.recognition.confidence !== undefined
        ? `${Math.round(tracker.recognition.confidence * 100)}%`
        : "";

      const labelMetrics = ctx.measureText(labelText);
      const labelWidth = Math.min(labelMetrics.width + 16, canvas.width - 12);
      const labelHeight = 26;
      const labelX = x;
      const labelY = Math.max(y - labelHeight - 10, 8);

      ctx.fillStyle = textBgColor;
      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isRecognized ? "rgba(4, 45, 21, 1)" : "rgba(101, 67, 11, 1)";
      ctx.fillText(labelText, labelX + 8, labelY + labelHeight / 2);

      if (confidenceText) {
        ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        const confMetrics = ctx.measureText(confidenceText);
        const confX = x + width - confMetrics.width - 10;
        const confY = y + height - 10;

        ctx.fillStyle = textBgColor;
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(confX - 6, confY - 14, confMetrics.width + 12, 18, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isRecognized ? "rgba(4, 45, 21, 1)" : "rgba(101, 67, 11, 1)";
        ctx.textAlign = "center";
        ctx.fillText(confidenceText, confX + (confMetrics.width + 12) / 2, confY - 5);
      }
    });
  };

  useEffect(() => {
    const animate = () => {
      drawOverlay();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (isCameraActive) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      displayBoxesRef.current.clear();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [trackedFaces, isCameraActive]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 w-full h-full rounded-[20px]"
      style={{
        cursor: "crosshair",
        touchAction: "none",
      }}
    />
  );
};

export default FaceOverlayCanvas;
