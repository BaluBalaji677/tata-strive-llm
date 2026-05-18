import React, { useState, useEffect } from "react";
import LessonItem from "./LessonItem";
import TaskItem from "./TaskItem";
import { getTasksByModule } from "../../api/moduleTaskApi";

const ModuleAccordion = ({
  module,
  isLocked,
  selectedLesson,
  selectedTask,
  onSelectLesson,
  onSelectTask,
  completedLessons = [],
  taskSubmissions = [],
}) => {
  const safeModule = module ?? {};
  const lessons = Array.isArray(safeModule.lessons) ? safeModule.lessons : [];
  const safeCompletedLessons = Array.isArray(completedLessons) ? completedLessons : [];
  const safeSubmissions = Array.isArray(taskSubmissions) ? taskSubmissions : [];

  const [isExpanded, setIsExpanded] = useState(false);
  const [tasks, setTasks] = useState(Array.isArray(safeModule.tasks) ? safeModule.tasks : []);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState("");

  useEffect(() => {
    let isActive = true;

    const fetchTasks = async () => {
      if (!isExpanded || isLocked || !safeModule?.id) {
        return;
      }

      setIsLoadingTasks(true);
      setTaskError("");
      try {
        const response = await getTasksByModule(safeModule.id);
        console.log("[Student Task] fetched tasks response", response);
        console.log("[Student Task] module ID", safeModule.id);
        if (isActive) {
          setTasks(Array.isArray(response) ? response : []);
        }
      } catch (error) {
        console.error("Error fetching module tasks", error);
        if (isActive) {
          setTaskError("Unable to load tasks.");
        }
      } finally {
        if (isActive) {
          setIsLoadingTasks(false);
        }
      }
    };

    fetchTasks();
    return () => {
      isActive = false;
    };
  }, [isExpanded, safeModule?.id, isLocked]);

  return (
    <div className={`mb-2 ${isLocked ? "opacity-50" : ""}`}>
      <button
        onClick={() => !isLocked && setIsExpanded((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors ${isLocked ? "cursor-not-allowed bg-black/20" : "cursor-pointer hover:bg-white/5"}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">
            {safeModule?.title ?? "Untitled Module"}
          </span>
          {isLocked && <span title="Complete previous module tasks to unlock">Locked</span>}
        </div>
        {!isLocked && (
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isExpanded && !isLocked && (
        <div className="mt-1 space-y-1 pl-4 pr-2">
          {lessons.map((lesson) => (
            <LessonItem
              key={lesson?.id}
              lesson={lesson}
              isSelected={selectedLesson?.id === lesson?.id}
              onClick={onSelectLesson}
              isCompleted={safeCompletedLessons.includes(lesson?.id)}
            />
          ))}

          {isLoadingTasks && (
            <p className="p-2 text-xs text-slate-500">Loading tasks...</p>
          )}

          {!isLoadingTasks && taskError && (
            <p className="p-2 text-xs text-rose-400">{taskError}</p>
          )}

          {!isLoadingTasks && !taskError && tasks.map((task) => (
            <TaskItem
              key={task?.id}
              task={task}
              isSelected={selectedTask?.id === task?.id}
              onClick={onSelectTask}
              submissions={safeSubmissions.filter((submission) => submission?.moduleTask?.id === task?.id)}
            />
          ))}

          {lessons.length === 0 && !isLoadingTasks && tasks.length === 0 && (
            <p className="p-2 text-xs text-slate-500">No content.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleAccordion;
