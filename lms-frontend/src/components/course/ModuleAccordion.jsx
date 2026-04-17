import React, { useState } from "react";
import LessonItem from "./LessonItem";

const ModuleAccordion = ({ module, selectedLesson, onSelectLesson, completedLessons = [] }) => {
  // Default expanding the module if the selected lesson belongs to it, or if it's explicitly set.
  // We'll keep it simple: initially true or false based on internal state, but let's make it true by default
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
      >
        <span className="font-semibold text-slate-200 text-sm">
          {module.title}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && module.lessons && (
        <div className="pl-4 pr-2 mt-1 space-y-1">
          {module.lessons.map((lesson) => (
            <LessonItem 
              key={lesson.id} 
              lesson={lesson} 
              isSelected={selectedLesson?.id === lesson.id} 
              onClick={onSelectLesson} 
              isCompleted={completedLessons.includes(lesson.id)}
            />
          ))}
          {module.lessons.length === 0 && (
            <p className="text-xs text-slate-500 p-2">No lessons.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleAccordion;
