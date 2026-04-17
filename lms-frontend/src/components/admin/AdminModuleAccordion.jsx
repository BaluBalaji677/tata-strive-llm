import React, { useState } from "react";

function AdminModuleAccordion({
  module,
  index,
  onEditUpdate,
  onDelete,
  onAddLesson,
  selectedLessonId,
  onSelectLesson,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(module.title);

  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [newLessonData, setNewLessonData] = useState({ title: "", content: "", orderIndex: "" });

  const handleSaveModule = async () => {
    if (!editTitle.trim() || editTitle === module.title) {
      setIsEditing(false);
      return;
    }
    await onEditUpdate(module.id, editTitle);
    setIsEditing(false);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    await onAddLesson(module.id, {
      title: newLessonData.title,
      content: newLessonData.content,
      orderIndex: Number(newLessonData.orderIndex) || (module.lessons?.length || 0) + 1,
    });
    setIsAddingLesson(false);
    setNewLessonData({ title: "", content: "", orderIndex: "" });
  };

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all">
      {/* Module Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-black/20 p-4">
        <div className="flex flex-1 items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20 transition"
          >
            {isExpanded ? "−" : "+"}
          </button>
          
          {isEditing ? (
            <div className="flex flex-1 items-center gap-2 pr-4">
              <input
                type="text"
                autoFocus
                className="flex-1 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-sm text-white outline-none focus:border-indigo-400"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveModule()}
              />
              <button onClick={handleSaveModule} className="text-xs text-emerald-400 font-semibold hover:text-emerald-300">Save</button>
              <button onClick={() => { setIsEditing(false); setEditTitle(module.title); }} className="text-xs text-slate-400 hover:text-slate-300">Cancel</button>
            </div>
          ) : (
            <h3 className="font-semibold text-slate-200 cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
              <span className="text-indigo-400 mr-2">Module {index + 1}:</span>
              {module.title}
            </h3>
          )}
        </div>

        {!isEditing && (
          <div className="flex shrink-0 gap-2 pl-2">
            <button
              onClick={() => setIsAddingLesson(true)}
              title="Add Lesson"
              className="rounded bg-indigo-500/20 px-2 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/30 transition"
            >
              + Add
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="rounded bg-white/5 px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(module.id)}
              className="rounded bg-rose-500/20 px-2 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/30 transition"
            >
              Del
            </button>
          </div>
        )}
      </div>

      {/* Module Content (Lessons) */}
      {isExpanded && (
        <div className="bg-transparent p-3 space-y-1">
          {(!module.lessons || module.lessons.length === 0) && !isAddingLesson && (
            <div className="p-3 text-xs italic text-slate-500">No lessons. Click "+ Add" to create one.</div>
          )}

          {module.lessons && [...module.lessons]
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((lesson, lIdx) => {
              const isActive = selectedLessonId === lesson.id;
              return (
                <div
                  key={lesson.id}
                  onClick={() => onSelectLesson(lesson)}
                  className={`group flex cursor-pointer items-center justify-between rounded-lg p-2.5 transition ${
                    isActive ? "bg-indigo-500/20 border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${isActive ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-400 group-hover:bg-white/20"}`}>
                      {lIdx + 1}
                    </div>
                    <span className={`text-sm truncate ${isActive ? "text-indigo-200 font-semibold" : "text-slate-300"}`}>
                      {lesson.title}
                    </span>
                  </div>
                </div>
              );
            })}

          {/* Inline Add Lesson Form */}
          {isAddingLesson && (
            <div className="mt-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
              <form onSubmit={handleSaveLesson} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Lesson Title"
                  className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-400"
                  value={newLessonData.title}
                  onChange={(e) => setNewLessonData(prev => ({ ...prev, title: e.target.value }))}
                />
                <input
                  type="number"
                  placeholder={`Order (default: ${(module.lessons?.length || 0) + 1})`}
                  className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-400"
                  value={newLessonData.orderIndex}
                  onChange={(e) => setNewLessonData(prev => ({ ...prev, orderIndex: e.target.value }))}
                />
                <textarea
                  required
                  rows={2}
                  placeholder="Lesson Content (HTML / Text)"
                  className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-400"
                  value={newLessonData.content}
                  onChange={(e) => setNewLessonData(prev => ({ ...prev, content: e.target.value }))}
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAddingLesson(false)} className="rounded px-3 py-1 text-xs font-medium text-slate-300 hover:bg-white/10">Cancel</button>
                  <button type="submit" className="rounded bg-indigo-500 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-400">Save</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminModuleAccordion;
