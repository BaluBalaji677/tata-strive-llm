import React from "react";
import ModuleAccordion from "./course/ModuleAccordion";

const CourseSidebar = ({ course, selectedLesson, onSelectLesson, completedLessons = [] }) => {
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
          course.modules.map((module) => (
            <ModuleAccordion 
              key={module.id} 
              module={module} 
              selectedLesson={selectedLesson} 
              onSelectLesson={onSelectLesson}
              completedLessons={completedLessons}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CourseSidebar;
