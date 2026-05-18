import React, { useState, useEffect } from "react";
import { submitTaskCode, getStudentSubmissions } from "../../api/moduleTaskApi";
import { getProfile as getStudentProfile } from "../../services/profileService";

const ModuleTaskViewer = ({ task, courseId, submissions = [], onSubmissionSuccess }) => {
  const safeSubmissions = Array.isArray(submissions) ? submissions : [];
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [activeTab, setActiveTab] = useState("problem");
  const [execTime, setExecTime] = useState(0);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    if (!task) {
      setCode("");
      setResult(null);
      setStudentId(null);
      return;
    }

    if (task?.language === "java") {
      setCode("public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n        \n    }\n}");
    } else {
      setCode("# Write your code here\n");
    }

    setResult(null);
    setIsLoadingAuth(true);

    getStudentProfile()
      .then((profile) => {
        console.log("ModuleTaskViewer Resolved Student Profile:", profile);
        if (profile?.id) {
          setStudentId(profile.id);
          getStudentSubmissions(profile.id)
            .then((fetchedSubmissions) => {
              const subsForTask = (Array.isArray(fetchedSubmissions) ? fetchedSubmissions : [])
                .filter((submission) => submission?.moduleTask?.id === task?.id);

              if (subsForTask.length > 0) {
                subsForTask.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
                setResult({
                  status: subsForTask[0]?.status,
                  score: subsForTask[0]?.score,
                  feedback: subsForTask[0]?.feedback,
                });
                setCode(subsForTask[0]?.code || "");
              }
            })
            .catch((err) => console.error("Error fetching submissions:", err));
        } else {
          console.warn("ModuleTaskViewer: Student ID is undefined in profile");
        }
      })
      .catch((err) => console.error("Error fetching student profile:", err))
      .finally(() => setIsLoadingAuth(false));
  }, [task]);

  const handleSubmit = async () => {
    if (!studentId || !task?.id) {
      alert("Unable to fetch student ID or task. Please relogin.");
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    setExecTime(0);

    const timer = setInterval(() => {
      setExecTime((prev) => prev + 0.1);
    }, 100);

    try {
      const response = await submitTaskCode(studentId, task.id, code);
      setResult({
        status: response?.status,
        score: response?.score,
        feedback: response?.feedback,
        executionTimeMs: response?.executionTimeMs,
      });
      onSubmissionSuccess?.();
      setActiveTab("submissions");
    } catch (err) {
      console.error(err);
      if (err?.response?.data?.message) {
        setResult({ status: "ERROR", feedback: err.response.data.message });
      } else {
        setResult({ status: "ERROR", feedback: "Failed to connect to execution server. Ensure backend is running." });
      }
    } finally {
      clearInterval(timer);
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  const taskHistory = safeSubmissions
    .filter((submission) => submission?.moduleTask?.id === task?.id)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  return (
    <div className="flex h-full flex-col bg-[#0b0f19] lg:flex-row">
      <div className="flex w-full flex-col border-b border-white/10 bg-white/5 lg:w-1/3 lg:border-b-0 lg:border-r">
        <div className="flex border-b border-white/10 bg-black/20">
          <button
            onClick={() => setActiveTab("problem")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "problem" ? "border-b-2 border-indigo-500 bg-white/5 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-300"}`}
          >
            Problem
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "submissions" ? "border-b-2 border-indigo-500 bg-white/5 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-300"}`}
          >
            Submissions
          </button>
        </div>

        {activeTab === "problem" ? (
          <div className="flex h-full flex-col overflow-hidden">
            <div className="shrink-0 border-b border-white/10 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{task?.title ?? "Untitled Task"}</h2>
                <div className="flex items-center space-x-2">
                  {task?.difficulty && (
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      task.difficulty === "EASY" ? "bg-emerald-500/20 text-emerald-400" :
                      task.difficulty === "MEDIUM" ? "bg-amber-500/20 text-amber-400" :
                      "bg-rose-500/20 text-rose-400"
                    }`}>
                      {task.difficulty}
                    </span>
                  )}
                  <span className="rounded bg-indigo-400/10 px-2 py-1 text-xs font-bold uppercase tracking-wider text-indigo-400">
                    {task?.maxScore ?? 0} PTS
                  </span>
                </div>
              </div>
              <p className="mt-2 font-mono text-xs uppercase tracking-wider text-slate-400">Lang: {task?.language ?? "N/A"}</p>
            </div>
            <div className="flex-1 overflow-y-auto whitespace-pre-wrap p-5 text-sm leading-relaxed text-slate-300">
              {task?.description ?? "No description provided."}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col overflow-hidden">
            <div className="shrink-0 border-b border-white/10 p-5">
              <h2 className="text-lg font-bold text-white">Submission History</h2>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {taskHistory.length === 0 ? (
                <p className="mt-4 text-center text-sm text-slate-500">No submissions yet.</p>
              ) : (
                taskHistory.map((submission) => (
                  <div
                    key={submission?.id}
                    className="cursor-pointer rounded-lg border border-white/5 bg-black/30 p-3 text-sm transition-colors hover:border-white/10"
                    onClick={() => {
                      setCode(submission?.code || "");
                      setResult({
                        status: submission?.status,
                        score: submission?.score,
                        feedback: submission?.feedback,
                        executionTimeMs: submission?.executionTimeMs,
                      });
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        submission?.status === "PASS" ? "bg-emerald-500/20 text-emerald-400" :
                        submission?.status === "FAIL" ? "bg-rose-500/20 text-rose-400" :
                        "bg-amber-500/20 text-amber-400"
                      }`}>
                        {submission?.status}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(submission?.submittedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Score: {submission?.score ?? 0} / {task?.maxScore ?? 0}</span>
                      {submission?.executionTimeMs !== undefined && (
                        <span className="font-mono text-[10px] text-slate-500">{submission.executionTimeMs}ms</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex h-full flex-1 flex-col">
        <div className="relative flex-1 p-4">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-full w-full resize-none rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-sm text-emerald-300 shadow-inner outline-none focus:border-indigo-500/50"
            spellCheck="false"
          />
        </div>

        <div className="flex min-h-[200px] h-1/3 flex-col border-t border-white/10 bg-slate-900">
          <div className="flex items-center justify-between border-b border-white/5 bg-black/20 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Execution Result</span>
            <div className="flex items-center space-x-4">
              {isSubmitting && (
                <span className="rounded bg-indigo-500/10 px-2 py-1 font-mono text-xs font-bold text-indigo-400">
                  {execTime.toFixed(1)}s
                </span>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isLoadingAuth}
                className="flex items-center space-x-2 rounded bg-emerald-500 px-6 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg className="-ml-1 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Running...</span>
                  </>
                ) : (
                  <span>Submit Code</span>
                )}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
            {!result ? (
              <span className="text-slate-600">Run your code to see output...</span>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${
                    result?.status === "PASS" ? "bg-emerald-500/20 text-emerald-400" :
                    result?.status === "FAIL" ? "bg-rose-500/20 text-rose-400" :
                    "bg-amber-500/20 text-amber-400"
                  }`}>
                    {result?.status}
                  </span>
                  <span className="text-slate-300">Score: {result?.score ?? 0} / {task?.maxScore ?? 0}</span>
                </div>
                <div className="whitespace-pre-wrap rounded border border-white/5 bg-black/30 p-3 text-slate-400">
                  {result?.feedback || "No feedback"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleTaskViewer;
