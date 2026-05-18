import React from "react";

const TaskItem = ({ task, isSelected, onClick, submissions = [] }) => {
  let status = "PENDING";
  if (submissions.length > 0) {
    // Sort by submittedAt desc
    const latest = [...submissions].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
    status = latest.status;
  }

  return (
    <button
      onClick={() => onClick(task)}
      className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors ${
        isSelected 
          ? "bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30" 
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        {status === "PASS" ? (
          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold" title="Passed">✔</span>
        ) : status === "FAIL" ? (
          <span className="text-xs bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold" title="Failed">❌</span>
        ) : (
          <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold" title="Pending">⏳</span>
        )}
        <span className="truncate">{task.title}</span>
      </div>
      <span className="text-xs text-slate-500 shrink-0">{task.maxScore} pts</span>
    </button>
  );
};

export default TaskItem;
