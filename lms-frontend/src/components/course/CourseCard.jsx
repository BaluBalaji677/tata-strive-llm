import React from "react";
import { useNavigate } from "react-router-dom";

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  
  return (
    <div
      onClick={() => navigate(`/course/${course.id}`)}
      className="bg-white/5 cursor-pointer flex flex-col justify-between rounded-xl shadow-sm border border-white/10 p-6 hover:shadow-md hover:border-indigo-400/50 hover:bg-white/10 transition-all group min-h-[160px]"
    >
      <div>
        <h2 className="text-xl font-semibold text-white group-hover:text-indigo-300 mb-2 transition-colors">
          {course.name || course.title}
        </h2>
        {course.description && (
          <p className="text-sm text-slate-300 mb-4 line-clamp-2">{course.description}</p>
        )}
      </div>
      <div className="flex items-center text-sm font-medium text-indigo-400 mt-4">
        <span>View Course</span>
        <svg 
          className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
    </div>
  );
};

export default CourseCard;
