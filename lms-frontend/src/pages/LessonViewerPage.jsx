import React, { useEffect, useState } from "react";
import { getLessonById } from "../services/courseService";
import { markLessonComplete } from "../services/progressService";

const LessonViewerPage = ({ lessonId, prevLesson, nextLesson, isNextModuleLocked, onNavigate, isCompleted, onLessonCompleted }) => {
  const [lessonContent, setLessonContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMarking, setIsMarking] = useState(false);

  useEffect(() => {
    if (!lessonId) return;

    const fetchLesson = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLessonById(lessonId);
        setLessonContent(data);
      } catch (err) {
        setError("Failed to load lesson content.");
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  const handleMarkComplete = async () => {
    if (isCompleted || !lessonId) return;
    setIsMarking(true);
    try {
      await markLessonComplete(lessonId);
      onLessonCompleted(lessonId); // Call parent to update state and navigate
    } catch (err) {
      console.error("Failed to mark lesson complete", err);
      alert("Failed to save progress.");
    } finally {
      setIsMarking(false);
    }
  };

  if (!lessonId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Select a lesson from the sidebar to start learning</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400 animate-pulse">Loading lesson content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-rose-400">{error}</p>
      </div>
    );
  }

  if (!lessonContent) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto w-full h-full flex flex-col relative">
      <div className="flex-1">
        <div className="flex justify-between items-start mb-8 pb-4 border-b border-white/10">
          <h1 className="text-3xl font-bold text-white">
            {lessonContent.title}
          </h1>
          {isCompleted && (
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center space-x-1 shrink-0 mt-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span>Completed</span>
            </span>
          )}
        </div>
        
        <div 
          className="prose prose-invert max-w-none prose-h2:text-2xl prose-h2:font-semibold prose-h2:text-white prose-p:text-slate-300 prose-pre:bg-black/40 border border-transparent prose-pre:border-white/10 prose-pre:text-slate-300 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: lessonContent.content }} 
        />

        {/* Progress Action */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={handleMarkComplete}
            disabled={isCompleted || isMarking}
            className={`
              flex items-center px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 shadow-lg
              ${isCompleted 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed opacity-80' 
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
              }
            `}
          >
            {isMarking ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : isCompleted ? (
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span>Completed</span>
              </span>
            ) : (
              "Mark as Complete"
            )}
          </button>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between pb-8">
        {prevLesson ? (
          <button
            onClick={() => onNavigate(prevLesson)}
            className="flex items-center px-4 py-2 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5 mr-2 -ml-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous: {prevLesson.title}
          </button>
        ) : (
          <div /> /* Empty div to push 'Next' to the right */
        )}

        {nextLesson && (
          <div className="relative group flex items-center">
            {isNextModuleLocked && (
              <div className="absolute bottom-full right-0 mb-2 w-max px-3 py-1 bg-rose-500/90 text-white text-xs font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Complete coding task to continue
                <div className="absolute top-full right-4 -mt-[1px] border-4 border-transparent border-t-rose-500/90"></div>
              </div>
            )}
            <button
              onClick={() => !isNextModuleLocked && onNavigate(nextLesson)}
              disabled={isNextModuleLocked}
              className={`flex items-center px-4 py-2 text-sm font-medium transition-colors shadow-sm ${
                isNextModuleLocked 
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70' 
                  : 'text-white bg-indigo-500/80 border border-indigo-500/30 rounded-lg hover:bg-indigo-500'
              }`}
            >
              <span className="truncate max-w-[150px] sm:max-w-[200px]">Next: {nextLesson.title}</span>
              {isNextModuleLocked ? (
                <span className="ml-2 -mr-1 shrink-0 text-slate-500" title="Locked">🔒</span>
              ) : (
                <svg className="w-5 h-5 ml-2 -mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonViewerPage;
