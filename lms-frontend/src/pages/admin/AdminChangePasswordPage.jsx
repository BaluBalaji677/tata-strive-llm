import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changeAdminPassword } from "../../api/authApi";
import { setMustChangePassword } from "../../utils/token";
import Toast from "../../components/Toast";

function AdminChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password must match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await changeAdminPassword({ currentPassword, newPassword });
      setMustChangePassword(false);
      setSuccess("Password changed successfully.");
      setToastMessage("Password changed successfully!");
      setToastType("success");
      setShowToast(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/admin/dashboard"), 1500);
    } catch (err) {
      const backendData = err?.response?.data;
      const message =
        (backendData && typeof backendData === "string" && backendData) ||
        backendData?.message ||
        backendData?.error ||
        err?.message ||
        "Failed to change password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      {showToast && <Toast message={toastMessage} type={toastType} />}
      
      <div className="glass w-full max-w-md rounded-3xl p-6">
        <h1 className="mb-2 text-2xl font-bold">Change Password</h1>
        <p className="text-sm text-slate-300">
          Your password must be changed before continuing to the dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
              placeholder="Enter your current password"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
              placeholder="Enter your new password"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
              placeholder="Confirm your new password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 px-4 py-2 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
          <p className="font-semibold mb-2">Password Requirements:</p>
          <ul className="space-y-1 text-slate-400">
            <li>• At least 6 characters long</li>
            <li>• Different from your current password</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminChangePasswordPage;
