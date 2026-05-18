import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin, studentLogin } from "../../api/authApi";
import { setAuth } from "../../utils/token";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("ADMIN");
  const [form, setForm] = useState({
    username: "",
    rollNumber: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRoleBasedRedirect = (role) => {
    // Role-based navigation logic
    if (role === "PRINCIPAL") {
      navigate("/principal/dashboard");
    } else if (role === "ADMIN") {
      navigate("/admin/dashboard");
    } else if (role === "STUDENT") {
      navigate("/student/dashboard");
    } else {
      navigate("/login");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "ADMIN" || mode === "PRINCIPAL") {
        // Both ADMIN and PRINCIPAL use the same login endpoint
        const res = await adminLogin({
          username: form.username,
          password: form.password,
        });

        setAuth(res);
        handleRoleBasedRedirect(res.role);
      } else {
        const res = await studentLogin({
          rollNumber: form.rollNumber,
          password: form.password,
        });

        setAuth(res);
        navigate(
          res.mustChangePassword
            ? "/change-password"
            : "/student/dashboard"
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Login failed. Check credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#0a0f1f]">

      {/* Glass Card */}
      <div className="w-full max-w-md p-8 rounded-3xl 
      bg-white/5 backdrop-blur-xl 
      border border-white/10 
      shadow-[0_0_40px_rgba(56,189,248,0.15)]">

        {/* Title */}
        <h1 className="text-3xl font-bold text-white text-center mb-6 tracking-wide">
          LMS Login
        </h1>

        {/* Toggle */}
        <div className="flex mb-6 bg-white/10 rounded-xl p-1 gap-1">
          <button
            onClick={() => setMode("PRINCIPAL")}
            className={`flex-1 py-2 rounded-lg text-sm transition-all duration-300 ${
              mode === "PRINCIPAL"
                ? "bg-gradient-to-r from-purple-400 to-pink-600 text-white shadow-lg"
                : "text-gray-300 hover:text-gray-200"
            }`}
          >
            Principal
          </button>
          <button
            onClick={() => setMode("ADMIN")}
            className={`flex-1 py-2 rounded-lg text-sm transition-all duration-300 ${
              mode === "ADMIN"
                ? "bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-lg"
                : "text-gray-300 hover:text-gray-200"
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => setMode("STUDENT")}
            className={`flex-1 py-2 rounded-lg text-sm transition-all duration-300 ${
              mode === "STUDENT"
                ? "bg-gradient-to-r from-emerald-400 to-teal-600 text-white shadow-lg"
                : "text-gray-300 hover:text-gray-200"
            }`}
          >
            Student
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5">

          {/* Username / Roll */}
          {mode === "STUDENT" ? (
            <input
              name="rollNumber"
              placeholder="Student Roll Number"
              value={form.rollNumber}
              onChange={onChange}
              className="w-full px-4 py-3 rounded-xl 
              bg-white/10 border border-white/20 
              text-white placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-emerald-400/60
              transition"
              required
            />
          ) : (
            <input
              name="username"
              placeholder={mode === "PRINCIPAL" ? "Principal Username" : "Admin Username"}
              value={form.username}
              onChange={onChange}
              className="w-full px-4 py-3 rounded-xl 
              bg-white/10 border border-white/20 
              text-white placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-sky-400/60
              transition"
              required
            />
          )}

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={onChange}
              className="w-full px-4 py-3 pr-12 rounded-xl 
              bg-white/10 border border-white/20 
              text-white placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-sky-400/60
              transition"
              required
            />

            {/* Eye Icon */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 
              w-10 h-10 flex items-center justify-center 
              rounded-full 
              bg-gradient-to-br from-sky-400/30 to-blue-600/30 
              backdrop-blur-md 
              shadow-lg hover:shadow-sky-400/40 
              hover:scale-110 
              transition-all duration-300"
            >
              {showPassword ? (
                <svg
                  className="w-5 h-5 text-sky-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeWidth={2} d="M3 3l18 18M10.58 10.58a3 3 0 104.24 4.24" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-sky-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeWidth={2} d="M15 12a3 3 0 11-6 0" />
                  <path strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7" />
                </svg>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm text-center">
              {error}
            </p>
          )}

          {/* Demo Credentials Hint */}
          {mode === "PRINCIPAL" && (
            <p className="text-xs text-gray-400 text-center">
              Demo: principal / principal123
            </p>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl 
            text-white font-semibold 
            shadow-lg 
            hover:scale-[1.02] 
            transition-all duration-300
            disabled:opacity-50 ${
              mode === "PRINCIPAL"
                ? "bg-gradient-to-r from-purple-400 to-pink-600 hover:shadow-purple-500/50"
                : mode === "ADMIN"
                ? "bg-gradient-to-r from-sky-400 to-blue-600 hover:shadow-sky-500/50"
                : "bg-gradient-to-r from-emerald-400 to-teal-600 hover:shadow-emerald-500/50"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;