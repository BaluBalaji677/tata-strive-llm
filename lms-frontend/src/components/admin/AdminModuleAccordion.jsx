import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ModuleItemCard from "./ModuleItemCard";
import TaskList from "./TaskList";

const actionBaseClass =
  "inline-flex min-h-10 min-w-[120px] items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition duration-200";

const lessonActionClass = `${actionBaseClass} border-indigo-400/20 bg-indigo-500/15 text-indigo-200 hover:border-indigo-300/40 hover:bg-indigo-500/25 hover:shadow-[0_10px_24px_-16px_rgba(99,102,241,0.95)]`;
const taskActionClass = `${actionBaseClass} border-emerald-400/20 bg-emerald-500/15 text-emerald-200 hover:border-emerald-300/40 hover:bg-emerald-500/25 hover:shadow-[0_10px_24px_-16px_rgba(16,185,129,0.95)]`;
const editActionClass = `${actionBaseClass} border-amber-400/20 bg-amber-500/15 text-amber-100 hover:border-amber-300/40 hover:bg-amber-500/25 hover:shadow-[0_10px_24px_-16px_rgba(245,158,11,0.95)]`;
const deleteActionClass = `${actionBaseClass} border-rose-400/20 bg-rose-500/15 text-rose-100 hover:border-rose-300/40 hover:bg-rose-500/25 hover:shadow-[0_10px_24px_-16px_rgba(244,63,94,0.95)]`;
const neutralActionClass = `${actionBaseClass} border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10`;

const ActionIcon = ({ path }) => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

function AdminModuleAccordion({
  module,
  index,
  onEditUpdate,
  onDelete,
  onAddLesson,
  onAddTask,
  selectedLessonId,
  selectedTaskId,
  onSelectLesson,
  onSelectTask,
  tasks = [],
  tasksLoading = false,
  taskError = "",
}) {
  const safeModule = module ?? {};
  const lessons = useMemo(() => {
    const safeLessons = Array.isArray(safeModule?.lessons) ? safeModule.lessons : [];
    return [...safeLessons].sort((a, b) => (a?.orderIndex ?? 0) - (b?.orderIndex ?? 0));
  }, [safeModule]);
  const moduleTasks = Array.isArray(tasks) ? tasks : [];

  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(safeModule?.title ?? "");
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [newLessonData, setNewLessonData] = useState({ title: "", content: "", orderIndex: "" });

  const handleSaveModule = async () => {
    if (!editTitle.trim() || editTitle === safeModule?.title) {
      setIsEditing(false);
      return;
    }
    await onEditUpdate?.(safeModule?.id, editTitle);
    setIsEditing(false);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    await onAddLesson?.(safeModule?.id, {
      title: newLessonData.title,
      content: newLessonData.content,
      orderIndex: Number(newLessonData.orderIndex) || lessons.length + 1,
    });
    setIsAddingLesson(false);
    setNewLessonData({ title: "", content: "", orderIndex: "" });
  };

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.92))] shadow-[0_24px_60px_-42px_rgba(15,23,42,1)]"
    >
      <div className="module-header flex flex-col gap-4 border-b border-white/8 bg-white/[0.03] p-5">
        <div className="flex min-w-0 items-start gap-3">
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  autoFocus
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400/50"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveModule()}
                />
                <div className="module-actions flex flex-wrap gap-3">
                  <button onClick={handleSaveModule} className={taskActionClass}>Save</button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditTitle(safeModule?.title ?? "");
                    }}
                    className={neutralActionClass}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-w-0 flex-col gap-2">
                <span className="inline-flex w-fit items-center rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200">
                  Module {index + 1}
                </span>
                <h3
                  className="truncate text-lg font-semibold text-white"
                  title={safeModule?.title ?? "Untitled Module"}
                >
                  {safeModule?.title ?? "Untitled Module"}
                </h3>
              </div>
            )}
          </div>
        </div>

        {!isEditing && (
          <>
            <div className="module-actions flex flex-wrap gap-3">
              <button onClick={() => setIsAddingLesson(true)} className={lessonActionClass}>
                <ActionIcon path="M12 4v16m8-8H4" />
                + Lesson
              </button>
              <button onClick={() => onAddTask?.(safeModule?.id)} className={taskActionClass}>
                <ActionIcon path="M12 4v16m8-8H4" />
                + Task
              </button>
              <button onClick={() => setIsEditing(true)} className={editActionClass}>
                <ActionIcon path="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                Edit
              </button>
              <button onClick={() => onDelete?.(safeModule?.id)} className={deleteActionClass}>
                <ActionIcon path="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673A2.25 2.25 0 0 1 15.916 21H8.084a2.25 2.25 0 0 1-2.244-2.327L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0A48.11 48.11 0 0 1 8.25 5.393m7.5 0V4.5A2.25 2.25 0 0 0 13.5 2.25h-3A2.25 2.25 0 0 0 8.25 4.5v.893m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                Delete
              </button>
            </div>

            <div className="module-stats flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                {lessons.length} Lesson{lessons.length === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                {moduleTasks.length} Task{moduleTasks.length === 1 ? "" : "s"}
              </span>
            </div>
          </>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="module-content space-y-5 p-5">
              {lessons.length === 0 && moduleTasks.length === 0 && !isAddingLesson && !tasksLoading && !taskError && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-5 text-sm italic text-slate-500">
                  No lessons or coding tasks yet. Add content to this module.
                </div>
              )}

              {lessons.length > 0 && (
                <div className="space-y-3 rounded-[22px] border border-white/8 bg-white/[0.025] p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">Lessons</div>
                  <div className="space-y-2">
                    {lessons.map((lesson, lessonIndex) => {
                      const isActive = selectedLessonId === lesson?.id;
                      return (
                        <ModuleItemCard
                          key={lesson?.id ?? `${safeModule?.id}-lesson-${lessonIndex}`}
                          index={lessonIndex + 1}
                          title={lesson?.title ?? "Untitled Lesson"}
                          isActive={isActive}
                          accent="indigo"
                          onClick={() => onSelectLesson?.(lesson)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3 rounded-[22px] border border-white/8 bg-white/[0.025] p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">Coding Tasks</div>

                <TaskList
                  tasks={moduleTasks}
                  selectedTaskId={selectedTaskId}
                  tasksLoading={tasksLoading}
                  taskError={taskError}
                  onSelectTask={onSelectTask}
                />
              </div>

              {isAddingLesson && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[22px] border border-indigo-400/20 bg-indigo-500/10 p-4"
                >
                  <form onSubmit={handleSaveLesson} className="space-y-3">
                    <input
                      type="text"
                      required
                      placeholder="Lesson Title"
                      className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-300/40"
                      value={newLessonData.title}
                      onChange={(e) => setNewLessonData((prev) => ({ ...prev, title: e.target.value }))}
                    />
                    <input
                      type="number"
                      placeholder={`Order (default: ${lessons.length + 1})`}
                      className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-300/40"
                      value={newLessonData.orderIndex}
                      onChange={(e) => setNewLessonData((prev) => ({ ...prev, orderIndex: e.target.value }))}
                    />
                    <textarea
                      required
                      rows={3}
                      placeholder="Lesson Content (HTML / Text)"
                      className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-300/40"
                      value={newLessonData.content}
                      onChange={(e) => setNewLessonData((prev) => ({ ...prev, content: e.target.value }))}
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <button type="button" onClick={() => setIsAddingLesson(false)} className={neutralActionClass}>
                        Cancel
                      </button>
                      <button type="submit" className={lessonActionClass}>
                        Save Lesson
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AdminModuleAccordion;
