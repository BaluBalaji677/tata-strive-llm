import { useEffect } from "react";

function SuccessAttendanceModal({ isVisible, message, rollNumber, onClose }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative overflow-hidden rounded-[28px] border border-emerald-400/30 bg-gradient-to-br from-emerald-950/80 to-emerald-900/80 p-0 shadow-[0_40px_120px_rgba(16,185,129,0.2)]">
        {/* Success Animation Container */}
        <div className="px-8 py-12 text-center">
          {/* Checkmark Animation */}
          <div className="relative mb-6 flex justify-center">
            <div className="relative h-20 w-20">
              <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-400/20" />
              <div className="absolute inset-2 rounded-full border-2 border-emerald-400/40" />

              <div className="flex h-20 w-20 items-center justify-center">
                <svg
                  className="h-10 w-10 animate-bounce text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-emerald-100">
              Attendance Marked! ✅
            </h3>
            {rollNumber && (
              <p className="text-sm text-emerald-200/80">
                Student {rollNumber} - Welcome!
              </p>
            )}
            {message && (
              <p className="text-sm text-emerald-200/80">
                {message}
              </p>
            )}
          </div>

          {/* Loading Bar */}
          <div className="mt-6 h-1 overflow-hidden rounded-full bg-emerald-400/20">
            <div
              className="h-full w-full animate-[shrink_3s_ease-in-out_forwards] bg-gradient-to-r from-emerald-400 to-cyan-400"
              style={{
                animation: "shrink 3s ease-in-out forwards",
              }}
            />
          </div>
        </div>

        <style>{`
          @keyframes shrink {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default SuccessAttendanceModal;
