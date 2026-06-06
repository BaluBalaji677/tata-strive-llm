/**
 * DetectionPanel Component
 * 
 * Real-time detection statistics panel showing:
 * - Live face count
 * - Recognized students
 * - Unknown faces
 * - Confidence scores
 * - Professional AI dashboard appearance
 */

const DetectionPanel = ({ 
  trackedFaces = [],
  isProcessing = false,
  lastUpdateTime = null 
}) => {
  const activeFaces = trackedFaces.length;
  const recognizedStudents = trackedFaces.filter(
    (tracker) => tracker.recognition?.rollNumber && tracker.recognition.rollNumber !== "UNKNOWN"
  );
  const unknownFaces = Math.max(0, activeFaces - recognizedStudents.length);
  const lastRecognitionTime = Math.max(
    ...trackedFaces.map((tracker) => tracker.lastRecognizedAt || 0),
    lastUpdateTime ? new Date(lastUpdateTime).getTime() : 0
  );
  const totalDetected = activeFaces;

  const getConfidenceColor = (distance) => {
    if (!distance) return "bg-slate-500/20 text-slate-400";
    const confidence = 1 - distance;
    if (confidence >= 0.85) return "bg-emerald-500/20 text-emerald-400";
    if (confidence >= 0.70) return "bg-cyan-500/20 text-cyan-400";
    if (confidence >= 0.55) return "bg-amber-500/20 text-amber-400";
    return "bg-rose-500/20 text-rose-400";
  };

  const getConfidenceLabel = (distance) => {
    if (!distance) return "—";
    const confidence = Math.round(Math.max(0, 1 - distance) * 100);
    if (confidence >= 85) return `${confidence}% ✓`;
    if (confidence >= 70) return `${confidence}% ◐`;
    if (confidence >= 55) return `${confidence}% ◑`;
    return `${confidence}% ✗`;
  };

  return (
    <div className="space-y-4">
      {/* Live Detection Stats */}
      <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/5 to-white/2 p-5 backdrop-blur-md">
        <div className="space-y-4">
          {/* Face Count */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Detected</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {totalDetected}
              </p>
              <p className="mt-1 text-xs text-slate-400">Face(s) in frame</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-500 font-semibold">Recognized</p>
              <p className="mt-2 text-3xl font-bold text-emerald-400">
                {recognizedStudents.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">Matched student(s)</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-500 font-semibold">Unknown</p>
              <p className="mt-2 text-3xl font-bold text-amber-400">
                {unknownFaces}
              </p>
              <p className="mt-1 text-xs text-slate-400">Unrecognized face(s)</p>
            </div>
          </div>

          {/* Status */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Status</p>
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400"></span>
                  </span>
                  <span className="text-xs text-cyan-300">Processing...</span>
                </div>
              ) : lastRecognitionTime ? (
                <span className="text-xs text-slate-300">
                  Last recognition: {new Date(lastRecognitionTime).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit',
                    hour12: true 
                  })}
                </span>
              ) : (
                <span className="text-xs text-slate-500">Waiting for detection...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recognized Students List */}
      {recognizedStudents.length > 0 && (
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
            <p className="text-sm font-semibold text-white">Recognized Students</p>
            <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-400">
              {recognizedStudents.length}
            </span>
          </div>
          <div className="space-y-2">
            {recognizedStudents.map((tracker, idx) => (
              <div key={tracker.trackingId || idx} className="group rounded-2xl border border-white/10 bg-slate-950/70 p-3 transition hover:border-emerald-400/30 hover:bg-slate-950/90">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{tracker.recognition.studentName}</p>
                    <p className="truncate text-xs text-slate-400">{tracker.recognition.rollNumber}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${
                      tracker.recognition.status === "Present"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : tracker.recognition.status === "Already Marked"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-slate-500/20 text-slate-400"
                    }`}>
                      {tracker.recognition.status}
                    </span>
                    {tracker.recognition.confidence !== undefined && (
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getConfidenceColor(1 - tracker.recognition.confidence)}`}>
                        {getConfidenceLabel(1 - tracker.recognition.confidence)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unknownFaces > 0 && (
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400"></div>
            <p className="text-sm font-semibold text-white">Unknown Faces</p>
            <span className="ml-auto rounded-full bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-400">
              {unknownFaces}
            </span>
          </div>
          <div className="space-y-2">
            {trackedFaces.filter((tracker) => !tracker.recognition?.rollNumber || tracker.recognition.rollNumber === "UNKNOWN").map((tracker, idx) => {
              const confidence = tracker.recognition.confidence !== undefined
                ? Math.round(tracker.recognition.confidence * 100)
                : null;

              return (
                <div key={tracker.trackingId || idx} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-300">Unknown Face #{idx + 1}</p>
                      <p className="text-xs text-slate-400">Not in database</p>
                    </div>
                    {confidence !== null && (
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${getConfidenceColor(1 - (confidence / 100))}`}>
                        {confidence}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalDetected === 0 && (
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="text-2xl opacity-50">🔍</div>
            <p className="text-sm text-slate-400">No faces detected</p>
            <p className="text-xs text-slate-500 max-w-xs">Position your face in the camera frame to begin detection</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionPanel;
