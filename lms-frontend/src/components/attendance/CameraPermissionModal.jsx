import { useState } from "react";

function CameraPermissionModal({ cameraStatus, onRetry, onClose }) {
  const [showInstructions, setShowInstructions] = useState(false);

  if (cameraStatus !== "denied" && cameraStatus !== "blocked") {
    return null;
  }

  const isDenied = cameraStatus === "denied";
  const isBlocked = cameraStatus === "blocked";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950 to-slate-900 p-0 shadow-[0_40px_120px_rgba(0,0,0,0.7)]">
        {/* Header */}
        <div className="border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 px-6 py-6">
          <div className="flex items-start gap-4">
            {/* Camera Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white">Camera Access Required</h3>
              <p className="mt-1 text-sm text-slate-400">Enable camera to mark attendance</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 px-6 py-6">
          {isDenied && !showInstructions && (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-300">
                This feature needs camera access to mark your attendance. Your face recognition data is processed locally
                and never stored permanently.
              </p>

              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-100">
                  ⚠️ Permission Denied
                </p>
                <p className="mt-2 text-sm text-amber-100">
                  You denied camera access. Retry to request permission again, or check browser settings to enable it
                  permanently.
                </p>
              </div>
            </div>
          )}

          {isBlocked && !showInstructions && (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-300">
                Camera access appears to be blocked. This might be due to browser settings or device policies.
              </p>

              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-100">
                  🔒 Camera Blocked
                </p>
                <p className="mt-2 text-sm text-rose-100">
                  Enable camera in your browser settings to continue.
                </p>
              </div>
            </div>
          )}

          {showInstructions && (
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-white">For Chrome/Edge:</p>
                <ol className="space-y-2 text-sm leading-6 text-slate-300">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                      1
                    </span>
                    <span>Click the 🔒 (lock) icon in the address bar</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                      2
                    </span>
                    <span>Click "Permissions" → Camera</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                      3
                    </span>
                    <span>Set Camera to "Allow"</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                      4
                    </span>
                    <span>Refresh the page</span>
                  </li>
                </ol>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-white">For Firefox:</p>
                <ol className="space-y-2 text-sm leading-6 text-slate-300">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                      1
                    </span>
                    <span>Click 🔒 in the address bar</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                      2
                    </span>
                    <span>Click the permissions arrow</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                      3
                    </span>
                    <span>Enable "Camera" permission</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                      4
                    </span>
                    <span>Refresh the page</span>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-slate-950/50 px-6 py-4">
          <div className="flex gap-3">
            {!showInstructions ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowInstructions(true)}
                  className="flex-1 rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Browser Instructions
                </button>
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex-1 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  Retry Camera
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowInstructions(false)}
                  className="flex-1 rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraPermissionModal;
