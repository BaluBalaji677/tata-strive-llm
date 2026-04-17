import React, { useState, useEffect } from "react";

function AdminLessonViewer({ lesson, onUpdate, onDelete, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: "", content: "", orderIndex: "" });

  useEffect(() => {
    if (lesson) {
      setEditData({
        title: lesson.title || "",
        content: lesson.content || "",
        orderIndex: lesson.orderIndex || 0,
      });
      setIsEditing(false); // reset edit state when lesson changes
    }
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 text-slate-400">
        <p>Select a lesson from the left to view or edit</p>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    await onUpdate(lesson.id, {
      title: editData.title,
      content: editData.content,
      orderIndex: Number(editData.orderIndex) || 0,
    });
    setIsEditing(false);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Viewer Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/20 p-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100">{lesson.title}</h2>
          <p className="text-sm text-slate-400 mt-1">Order Index: {lesson.orderIndex}</p>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-400 hover:bg-sky-500/30 transition"
            >
              Edit Lesson
            </button>
          )}
          <button
            onClick={() => onDelete(lesson.id)}
            className="rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/30 transition"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Editor or Viewer Body */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 max-w-3xl">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Lesson Title</label>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-indigo-500"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Order Index</label>
              <input
                type="number"
                required
                className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-indigo-500"
                value={editData.orderIndex}
                onChange={(e) => setEditData({ ...editData, orderIndex: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Content (Supports HTML)</label>
              <textarea
                required
                rows={12}
                className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-indigo-500 font-mono text-sm"
                value={editData.content}
                onChange={(e) => setEditData({ ...editData, content: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="prose prose-invert prose-indigo max-w-none">
            <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLessonViewer;
