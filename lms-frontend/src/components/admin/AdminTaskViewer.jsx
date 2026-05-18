import React, { useEffect, useState } from "react";

const starterCodeByLanguage = {
  java: "public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}",
  python: "# Write your code here\n",
};

function AdminTaskViewer({ task, onEdit, onDelete, onClose }) {
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!task) {
      setCode("");
      return;
    }

    setCode(starterCodeByLanguage[task?.language] ?? "// Write your code here");
  }, [task]);

  if (!task) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 text-slate-400">
        <p>Select a lesson or coding task from the left to view or edit</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 bg-black/20 p-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100">{task?.title ?? "Untitled Task"}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              {(task?.difficulty ?? "N/A").toString()}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              {(task?.language ?? "N/A").toString().toUpperCase()}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              {task?.maxScore ?? 0} pts
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onEdit?.(task)}
            className="rounded-lg bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-400 transition hover:bg-sky-500/30"
          >
            Edit Task
          </button>
          <button
            onClick={() => onDelete?.(task)}
            className="rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/30"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>

      <div className="grid h-full min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="min-h-0 overflow-y-auto border-b border-white/10 p-6 xl:border-b-0 xl:border-r">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">Problem</div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
              {task?.description ?? "No description provided."}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">Test Cases</div>
            <div className="mt-4 space-y-3">
              {(task?.testCases ?? []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-500">
                  No test cases configured.
                </div>
              ) : (
                (task?.testCases ?? []).map((testCase, index) => (
                  <div key={testCase?.id ?? `task-case-${index}`} className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-200">Case {index + 1}</div>
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <div>
                        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-500">Input</div>
                        <pre className="whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-xs text-slate-300">{testCase?.input || "(empty)"}</pre>
                      </div>
                      <div>
                        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-500">Expected Output</div>
                        <pre className="whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-xs text-slate-300">{testCase?.expectedOutput || "(empty)"}</pre>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="border-b border-white/10 bg-black/20 px-5 py-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">Code Editor</div>
          </div>
          <div className="min-h-0 flex-1 p-4">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-full min-h-[280px] w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-sm text-emerald-300 outline-none transition focus:border-indigo-500/40"
              spellCheck="false"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 bg-black/20 px-5 py-4">
            <button
              type="button"
              className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Run Code
            </button>
            <button
              type="button"
              className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Submit Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminTaskViewer;
