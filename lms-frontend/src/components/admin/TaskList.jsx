import React from "react";
import ModuleItemCard from "./ModuleItemCard";

function TaskList({
  tasks = [],
  selectedTaskId,
  tasksLoading = false,
  taskError = "",
  onSelectTask,
}) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  if (tasksLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((skeleton) => (
          <div key={`task-skeleton-${skeleton}`} className="animate-pulse rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3.5">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-white/10" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-40 rounded bg-white/10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (taskError) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
        {taskError}
      </div>
    );
  }

  if (safeTasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
        No coding tasks yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {safeTasks.map((task, taskIndex) => (
        <ModuleItemCard
          key={task?.id ?? `task-${taskIndex}`}
          index={taskIndex + 1}
          title={task?.title ?? "Untitled Task"}
          isActive={selectedTaskId === task?.id}
          accent="emerald"
          onClick={() => onSelectTask?.(task)}
        />
      ))}
    </div>
  );
}

export default TaskList;
