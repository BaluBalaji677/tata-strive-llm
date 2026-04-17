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

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "ADMIN") {
        const response = await adminLogin({ username: form.username, password: form.password });
        setAuth({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          role: response.role,
          username: response.username,
        });
        navigate("/admin/dashboard");
      } else {
        const response = await studentLogin({ rollNumber: form.rollNumber, password: form.password });
        setAuth({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          role: response.role,
          username: response.username,
        });
        const mustChangePassword = Boolean(response.mustChangePassword);
        navigate(mustChangePassword ? "/change-password" : "/student/dashboard");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass w-full max-w-md rounded-3xl p-6">
        <h1 className="mb-4 text-2xl font-bold">LMS Login</h1>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            className={`rounded-lg py-2 ${mode === "ADMIN" ? "bg-sky-500/60" : "bg-white/10"}`}
            onClick={() => setMode("ADMIN")}
            type="button"
          >
            Admin
          </button>
          <button
            className={`rounded-lg py-2 ${mode === "STUDENT" ? "bg-sky-500/60" : "bg-white/10"}`}
            onClick={() => setMode("STUDENT")}
            type="button"
          >
            Student
          </button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          {mode === "ADMIN" ? (
            <input
              name="username"
              className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              placeholder="Admin username"
              value={form.username}
              onChange={onChange}
              required
            />
          ) : (
            <input
              name="rollNumber"
              className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              placeholder="Student roll number"
              value={form.rollNumber}
              onChange={onChange}
              required
            />
          )}

          <input
            type="password"
            name="password"
            className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2"
            placeholder="Password"
            value={form.password}
            onChange={onChange}
            required
          />

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-sky-500 px-3 py-2 font-semibold disabled:opacity-60"
            type="submit"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;

