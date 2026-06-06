import { useState } from "react";

function ResetPasswordModal({ isOpen, admin, user, onClose, onConfirm, loading, role = "admin" }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const targetUser = user || admin;

  const handleConfirm = () => {
    setError("");
    
    if (!newPassword) {
      setError("Password is required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    onConfirm(newPassword);
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass w-full max-w-md rounded-3xl p-6 space-y-4">
        <h2 className="text-2xl font-bold text-white">Reset Password</h2>
        <p className="text-sm text-slate-300">
          Set a temporary password for <span className="font-semibold text-white">{targetUser?.fullName}</span> ({targetUser?.username}).
        </p>

        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Temporary Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter temporary password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm temporary password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
          <p className="font-semibold mb-1">Note:</p>
          <p>The {role} will be required to change this password on their next login.</p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordModal;
