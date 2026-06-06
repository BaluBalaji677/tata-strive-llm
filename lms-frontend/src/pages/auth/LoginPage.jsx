import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/authApi";
import { setAuth } from "../../utils/token";
import ThemeToggle from "../../components/ThemeToggle";

const themeConfig = {
  dark: {
    wrapper: "from-slate-950 via-slate-900 to-indigo-950",
    card: "border-white/10 bg-slate-950/70 text-white",
    accent: "from-sky-500 to-indigo-500",
    accentShadow: "shadow-[0_0_90px_-30px_rgba(56,189,248,0.55)]",
    input: "border-slate-700 bg-slate-950/40 focus:border-sky-400 focus:ring-sky-400/30 placeholder:text-slate-400",
  },
  purple: {
    wrapper: "from-violet-950 via-slate-950 to-fuchsia-950",
    card: "border-white/10 bg-slate-950/70 text-white",
    accent: "from-fuchsia-500 to-violet-600",
    accentShadow: "shadow-[0_0_80px_-30px_rgba(192,132,252,0.55)]",
    input: "border-slate-700 bg-slate-950/40 focus:border-fuchsia-400 focus:ring-fuchsia-400/30 placeholder:text-slate-400",
  },
  emerald: {
    wrapper: "from-slate-950 via-slate-900 to-emerald-950",
    card: "border-white/10 bg-slate-950/70 text-white",
    accent: "from-emerald-500 to-teal-500",
    accentShadow: "shadow-[0_0_80px_-30px_rgba(16,185,129,0.55)]",
    input: "border-slate-700 bg-slate-950/40 focus:border-emerald-400 focus:ring-emerald-400/30 placeholder:text-slate-400",
  },
  light: {
    wrapper: "from-slate-100 via-slate-200 to-slate-300",
    card: "border-slate-200/80 bg-white/85 text-slate-900",
    accent: "from-slate-400 to-slate-600",
    accentShadow: "shadow-[0_0_80px_-30px_rgba(148,163,184,0.45)]",
    input: "border-slate-300 bg-white/90 focus:border-slate-500 focus:ring-slate-500/20 placeholder:text-slate-500 text-slate-900",
  },
};

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [theme, setTheme] = useState("dark");

  const themeStyle = useMemo(() => themeConfig[theme], [theme]);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await login(form.identifier, form.password);
      setAuth({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        role: response.role,
        username: response.username,
        mustChangePassword: response.mustChangePassword,
      });
      const mustChangePassword = Boolean(response.mustChangePassword);
      if (response.role === "STUDENT") {
        navigate(mustChangePassword ? "/change-password" : "/student/dashboard");
      } else if (response.role === "ADMIN") {
        navigate(mustChangePassword ? "/admin/change-password" : "/admin/dashboard");
      } else if (response.role === "PRINCIPAL") {
        navigate("/principal/dashboard");
      } else if (response.role === "TEACHER") {
        navigate(mustChangePassword ? "/admin/change-password" : "/teacher/dashboard");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden bg-gradient-to-br ${themeStyle.wrapper} transition-colors duration-700`}>
      <ThemeToggle theme={theme} onChange={setTheme} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-16 right-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className={`relative w-full max-w-xl overflow-hidden rounded-[32px] border ${themeStyle.card} p-8 shadow-2xl shadow-black/30 backdrop-blur-xl ${themeStyle.accentShadow} animate-fade-in-up`}>
          <div className="absolute right-[-80px] top-[-60px] h-48 w-48 rounded-full bg-sky-500/10 blur-3xl opacity-80" />
          <div className="absolute left-[-70px] bottom-[-50px] h-52 w-52 rounded-full bg-violet-500/10 blur-3xl opacity-70" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                <svg viewBox="0 0 48 48" className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18l18 10 18-10-18-10-18 10z" />
                  <path d="M14 21v10a6 6 0 0 0 6 6h8a6 6 0 0 0 6-6V21" />
                  <path d="M12 14l12 7 12-7" />
                </svg>
              </div>
            </div>

            <div className="space-y-3 text-center">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">LMS Login</h1>
              <p className="mx-auto max-w-md text-sm text-slate-200/80 sm:text-base">
                Welcome back! Please login to your account
              </p>
            </div>

            <form className="space-y-5" onSubmit={onSubmit}>
              <label className="group block">
                <span className="mb-2 inline-block text-sm font-medium text-slate-200/90">Username or Roll Number</span>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" />
                      <path d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8" />
                    </svg>
                  </span>
                  <input
                    name="identifier"
                    value={form.identifier}
                    onChange={onChange}
                    required
                    placeholder="Username or Roll Number"
                    className={`w-full rounded-[24px] border px-4 py-4 pl-12 text-sm outline-none transition ${themeStyle.input}`}
                  />
                </div>
              </label>

              <label className="group block">
                <span className="mb-2 inline-block text-sm font-medium text-slate-200/90">Password</span>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    required
                    placeholder="Enter your password"
                    className={`w-full rounded-[24px] border px-4 py-4 pl-12 pr-12 text-sm outline-none transition ${themeStyle.input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center rounded-r-[24px] px-4 text-slate-300 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.97 10.97 0 0 1 12 19c-5.522 0-10-4.477-10-10 0-1.786.457-3.465 1.259-4.938" />
                        <path d="M1 1l22 22" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-slate-200/90">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-slate-900 text-sky-500 focus:ring-sky-300/70"
                  />
                  Remember me
                </label>

              </div>

              {error ? <p className="text-sm text-rose-300">{error}</p> : null}

              <button
                disabled={loading}
                type="submit"
                className={`flex w-full items-center justify-center gap-3 rounded-[24px] px-5 py-4 text-sm font-semibold text-white transition ${themeStyle.accent} bg-gradient-to-r hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-sky-300/60 disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-center text-sm text-slate-300">
              Don&apos;t have an account? <span className="font-semibold text-white">Contact your administrator</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;

