/**
 * CameraStatusBadge Component
 * 
 * Displays camera status in top-left corner of video:
 * - 🟢 Camera Active (when camera is on)
 * - 🔴 Camera Off (when camera is off)
 * - ⚠️ Models Loading (when models are loading)
 */

const CameraStatusBadge = ({ 
  isCameraActive = false, 
  isLoadingModels = false,
  faceCount = 0 
}) => {
  if (isLoadingModels) {
    return (
      <div className="pointer-events-none absolute top-3 left-3 z-30 flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/80 px-3 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2 animate-pulse">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400"></span>
          </span>
          <span className="text-xs font-semibold text-amber-100">Loading Models</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute top-3 left-3 z-30 flex items-center gap-3 rounded-full border border-white/20 bg-slate-950/80 px-3 py-2 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className={`relative flex h-2.5 w-2.5 ${isCameraActive ? "" : ""}`}>
          {isCameraActive ? (
            <>
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-pulse"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-slate-500"></span>
          )}
        </span>
        <div className="flex flex-col text-left">
          <span className={`text-xs font-semibold ${
            isCameraActive ? "text-emerald-100" : "text-slate-400"
          }`}>
            {isCameraActive ? "Camera Active" : "Camera Off"}
          </span>
          <span className="text-[11px] text-slate-400">Faces: {faceCount}</span>
        </div>
      </div>
    </div>
  );
};

export default CameraStatusBadge;
