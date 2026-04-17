import React from "react";

const LessonItem = ({ lesson, isSelected, onClick, isCompleted }) => {
  return (
    <button
      onClick={() => onClick(lesson)}
      className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors ${
        isSelected 
          ? "bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30" 
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
      }`}
    >
      <span className="truncate pr-2">{lesson.title}</span>
      {isCompleted && (
        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
};

export default LessonItem;
