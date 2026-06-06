import { useState } from "react";

const options = [
  { id: "dark", label: "Dark Blue", accent: "from-sky-500 to-indigo-500", ring: "ring-sky-400/30" },
  { id: "purple", label: "Purple", accent: "from-fuchsia-500 to-violet-600", ring: "ring-fuchsia-400/30" },
  { id: "emerald", label: "Emerald", accent: "from-emerald-500 to-teal-500", ring: "ring-emerald-400/30" },
  { id: "light", label: "Light", accent: "from-slate-200 to-slate-400", ring: "ring-slate-400/30" },
];

export default function ThemeToggle({ theme, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 top-4 z-30 flex items-start justify-end">
      <div className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-xl shadow-slate-950/20 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
          title="Theme settings"
        >
          <span className="sr-only">Open theme selector</span>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l2.09 4.26L18.9 7l-3.64 2.9L15.18 14 12 11.7 8.82 14l.92-4.1L6.1 7l4.81-.74L12 2z" />
          </svg>
        </button>

        {open ? (
          <div className="mt-3 w-56 rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="mb-3 px-1 text-xs uppercase tracking-[0.3em] text-slate-400">Theme</div>
            <div className="space-y-2">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                    theme === option.id
                      ? "border-sky-300/30 bg-slate-900/80 text-white"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`inline-flex h-3.5 w-3.5 rounded-full bg-gradient-to-br ${option.accent} ${option.ring}`}
                  />
                  <span className="flex-1 text-sm font-medium">{option.label}</span>
                  {theme === option.id ? (
                    <span className="text-xs uppercase tracking-[0.2em] text-sky-300">Active</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
