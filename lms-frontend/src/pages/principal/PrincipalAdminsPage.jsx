import { useState, useEffect } from "react";
import { getAuth } from "../../utils/token";
import { fetchAdmins, resetAdminPassword } from "../../api/authApi";
import ResetPasswordModal from "../../components/ResetPasswordModal";
import Toast from "../../components/Toast";

function PrincipalAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdmins(0, 100);
      setAdmins(data.content || []);
    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Failed to load admins";
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResetModal = (admin) => {
    setSelectedAdmin(admin);
    setShowResetModal(true);
  };

  const handleCloseResetModal = () => {
    setShowResetModal(false);
    setSelectedAdmin(null);
  };

  const handleResetPassword = async (newPassword) => {
    try {
      setResetLoading(true);
      const response = await resetAdminPassword(selectedAdmin.id, { newPassword });
      
      // Update local state to show mustChangePassword flag
      setAdmins(admins.map(a => 
        a.id === selectedAdmin.id ? { ...a, mustChangePassword: true } : a
      ));
      
      setToastMessage("Password reset successfully!");
      setToastType("success");
      setShowToast(true);
      
      handleCloseResetModal();
      
      // Auto-hide toast after 3 seconds
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Failed to reset password";
      setToastMessage(message);
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Manage Admins</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/10 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showToast && <Toast message={toastMessage} type={toastType} duration={3000} />}
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Manage Admins</h1>
        <button
          onClick={loadAdmins}
          className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Admins Table/List */}
      <div className="space-y-4">
        {admins.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center text-gray-400">
            No admins found
          </div>
        ) : (
          <div className="grid gap-4">
            {/* Header */}
            <div className="hidden md:grid grid-cols-5 gap-4 px-4 py-3 bg-white/5 rounded-lg text-sm font-semibold text-slate-300">
              <div>Username</div>
              <div>Full Name</div>
              <div>Email</div>
              <div>Status</div>
              <div>Action</div>
            </div>

            {/* Admin Cards/Rows */}
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition space-y-3 md:space-y-0 md:grid md:grid-cols-5 md:gap-4 md:items-center"
              >
                <div className="space-y-1">
                  <p className="md:hidden text-xs text-slate-400 font-medium">Username</p>
                  <p className="text-white font-semibold">@{admin.username}</p>
                </div>

                <div className="space-y-1">
                  <p className="md:hidden text-xs text-slate-400 font-medium">Full Name</p>
                  <p className="text-slate-300 text-sm">{admin.fullName || "N/A"}</p>
                </div>

                <div className="space-y-1">
                  <p className="md:hidden text-xs text-slate-400 font-medium">Email</p>
                  <p className="text-slate-400 text-sm">{admin.email || "N/A"}</p>
                </div>

                <div className="space-y-1">
                  <p className="md:hidden text-xs text-slate-400 font-medium">Status</p>
                  <div className="flex items-center gap-2">
                    {admin.mustChangePassword ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                        <span className="text-xs text-orange-300 font-medium">Must Change Password</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="text-xs text-emerald-300 font-medium">Active</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenResetModal(admin)}
                    className="flex-1 md:flex-none px-3 py-2 bg-gradient-to-r from-sky-400 to-blue-600 text-white text-sm font-medium rounded-lg hover:brightness-110 transition"
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ResetPasswordModal
        isOpen={showResetModal}
        admin={selectedAdmin}
        onClose={handleCloseResetModal}
        onConfirm={handleResetPassword}
        loading={resetLoading}
      />
    </div>
  );
}

export default PrincipalAdminsPage;
