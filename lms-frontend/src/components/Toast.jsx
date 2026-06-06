import { useEffect, useState } from "react";

function Toast({ message, type = "success", duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) return null;

  const bgColor = type === "success" ? "bg-emerald-500/90" : type === "error" ? "bg-red-500/90" : "bg-blue-500/90";
  const borderColor = type === "success" ? "border-emerald-400/50" : type === "error" ? "border-red-400/50" : "border-blue-400/50";
  const textColor = type === "success" ? "text-emerald-100" : type === "error" ? "text-red-100" : "text-blue-100";
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  return (
    <div className={`fixed top-4 right-4 ${bgColor} border ${borderColor} rounded-lg p-4 text-sm ${textColor} shadow-lg animate-slide-in-right z-50`}>
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold">{icon}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}

export default Toast;
