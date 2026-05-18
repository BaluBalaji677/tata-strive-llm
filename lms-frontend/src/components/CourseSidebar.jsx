import React, { useEffect, useState } from "react";
import ModuleAccordion from "./course/ModuleAccordion";
const CourseSidebar = ({ course, selectedLesson, selectedTask, onSelectLesson, onSelectTask, completedLessons = [], taskSubmissions = [], isAuthenticatedStudent = false, moduleStatuses = {}, onShowFinalResult }) => {
  if (!course || !course.modules) {
    return <div className="p-4 text-gray-500">No modules available</div>;
  }

  return (
    <div className="w-full h-full border-r border-transparent overflow-y-auto">
      <div className="p-5 border-b border-white/10">
        <h2 className="text-xl font-bold text-white">{course.name || course.title}</h2>
      </div>
      <div className="p-3">
        {course.modules.length === 0 ? (
          <p className="text-slate-400 text-sm px-2">No content yet.</p>
        ) : (
          course.modules.map((module, index) => {
            const isLocked = index > 0 && !moduleStatuses[course.modules[index - 1].id];
            return (
              <ModuleAccordion 
                key={module.id} 
                module={module} 
                isLocked={isLocked}
                selectedLesson={selectedLesson} 
                selectedTask={selectedTask}
                onSelectLesson={onSelectLesson}
                onSelectTask={onSelectTask}
                completedLessons={completedLessons}
                taskSubmissions={taskSubmissions}
              />
            );
          })
        )}
      </div>
      <div className="p-4 border-t border-white/10 mt-auto">
        <button
          onClick={() => {
            onSelectLesson(null);
            onSelectTask(null);
            if (onShowFinalResult) onShowFinalResult(true);
          }}
          className="w-full py-2.5 px-4 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-medium rounded-lg transition-colors border border-indigo-500/30 flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Course Results</span>
        </button>
      </div>
    </div>
  );
};

export default CourseSidebar;
