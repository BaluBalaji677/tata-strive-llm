import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  getCourseById, 
  updateAdminCourse, 
  deleteAdminCourse, 
  addModule, 
  updateModule, 
  deleteModule, 
  addLesson, 
  updateLesson, 
  deleteLesson 
} from "../../services/courseService";
import AdminModuleAccordion from "../../components/admin/AdminModuleAccordion";
import AdminLessonViewer from "../../components/admin/AdminLessonViewer";

function AdminCourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // App state
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseEditData, setCourseEditData] = useState({ title: "", description: "", duration: "" });
  
  // Quick Add Module state
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");

  const fetchCourse = async () => {
    try {
      const data = await getCourseById(id);
      setCourse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCourse();
    // eslint-disable-next-line
  }, [id]);

  // -------- COURSE OPS --------
  const handleEditCourseStart = () => {
    setCourseEditData({
      title: course.title || course.name || "",
      description: course.description || "",
      duration: course.duration || 0
    });
    setSelectedLesson(null);
    setIsEditingCourse(true);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateAdminCourse(id, courseEditData);
      setCourse(prev => ({ ...prev, ...updated }));
      setIsEditingCourse(false);
      alert("Course updated successfully");
    } catch {
      alert("Failed to update course");
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm("Are you sure you want to delete this entire course?")) return;
    try {
      await deleteAdminCourse(id);
      navigate("/admin/courses");
    } catch {
      alert("Failed to delete course");
    }
  };

  // -------- MODULE OPS --------
  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    try {
      const added = await addModule({ courseId: Number(id), title: newModuleTitle });
      setCourse(prev => ({
        ...prev,
        modules: [...(prev.modules || []), { ...added, lessons: [] }]
      }));
      setNewModuleTitle("");
      setIsAddingModule(false);
    } catch {
      alert("Failed to add module");
    }
  };

  const handleUpdateModule = async (moduleId, title) => {
    try {
      const updated = await updateModule(moduleId, title);
      setCourse(prev => ({
        ...prev,
        modules: prev.modules.map(m => (m.id === moduleId ? { ...m, title: updated.title } : m))
      }));
    } catch {
      alert("Failed to update module");
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm("Delete this module and all its lessons?")) return;
    try {
      await deleteModule(moduleId);
      setCourse(prev => ({
        ...prev,
        modules: prev.modules.filter(m => m.id !== moduleId)
      }));
    } catch {
      alert("Failed to delete module");
    }
  };

  // -------- LESSON OPS --------
  const handleAddLesson = async (moduleId, payload) => {
    try {
      const added = await addLesson({ ...payload, moduleId });
      setCourse(prev => ({
        ...prev,
        modules: prev.modules.map(m => 
          m.id === moduleId 
            ? { ...m, lessons: [...(m.lessons || []), added] } 
            : m
        )
      }));
      // Auto-select newly added lesson
      setSelectedLesson(added);
      setIsEditingCourse(false);
    } catch {
      alert("Failed to add lesson");
    }
  };

  const handleUpdateLesson = async (lessonId, payload) => {
    try {
      const updated = await updateLesson(lessonId, payload);
      setCourse(prev => ({
        ...prev,
        modules: prev.modules.map(m => ({
          ...m,
          lessons: (m.lessons || []).map(l => l.id === lessonId ? { ...l, ...updated } : l)
        }))
      }));
      setSelectedLesson(updated);
      alert("Updated successfully");
    } catch {
      alert("Failed to update lesson");
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Delete this lesson?")) return;
    try {
      await deleteLesson(lessonId);
      setCourse(prev => ({
        ...prev,
        modules: prev.modules.map(m => ({
          ...m,
          lessons: (m.lessons || []).filter(l => l.id !== lessonId)
        }))
      }));
      if (selectedLesson?.id === lessonId) setSelectedLesson(null);
      alert("Deleted successfully");
    } catch {
      alert("Failed to delete lesson");
    }
  };


  if (loading) return <div className="p-8 text-center text-slate-400">Loading course CMS...</div>;
  if (!course) return <div className="p-8 text-center text-rose-400">Course not found</div>;

  return (
    <div className="flex h-[calc(100vh-6rem)] w-full gap-6 overflow-hidden pl-4 pr-6">
      
      {/* LEFT SIDEBAR: Structure Tree (30%) */}
      <div className="flex w-[350px] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
        {/* Course Header Info */}
        <div className="border-b border-white/10 p-5 bg-white/5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <Link to="/admin/courses" className="hover:text-indigo-300">Courses</Link> &rarr; CMS
          </div>
          <h2 className="text-xl font-bold text-white truncate" title={course.title || course.name}>
            {course.title || course.name}
          </h2>
          <div className="mt-3 flex gap-2">
            <button 
              onClick={handleEditCourseStart}
              className="flex-1 rounded-lg bg-indigo-500/20 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/30 transition"
            >
              Edit Course
            </button>
            <button 
              onClick={handleDeleteCourse}
              className="rounded-lg bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/30 transition"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase">Curriculum</h3>
            <button 
              onClick={() => setIsAddingModule(!isAddingModule)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
            >
              + Add Module
            </button>
          </div>

          {isAddingModule && (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <form onSubmit={handleAddModule}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Module Title..."
                  required
                  value={newModuleTitle}
                  onChange={e => setNewModuleTitle(e.target.value)}
                  className="w-full rounded-md border border-white/20 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-400 mb-2"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAddingModule(false)} className="text-xs text-slate-300">Cancel</button>
                  <button type="submit" className="text-xs font-bold text-emerald-400">Save</button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-2 pb-8">
            {(!course.modules || course.modules.length === 0) ? (
              <p className="text-sm text-slate-500 italic">No modules. Create one to begin.</p>
            ) : (
              course.modules.map((module, mIdx) => (
                <AdminModuleAccordion 
                  key={module.id} 
                  module={module} 
                  index={mIdx}
                  selectedLessonId={selectedLesson?.id}
                  onEditUpdate={handleUpdateModule}
                  onDelete={handleDeleteModule}
                  onAddLesson={handleAddLesson}
                  onSelectLesson={(lesson) => {
                    setSelectedLesson(lesson);
                    setIsEditingCourse(false);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Viewer/Editor (70%) */}
      <div className="flex-1 overflow-hidden h-full">
        {isEditingCourse ? (
          <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="border-b border-white/10 bg-black/20 p-5">
              <h2 className="text-xl font-bold text-slate-100">Edit Course Details</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin hover:scrollbar-thumb-white/10">
              <form onSubmit={handleUpdateCourse} className="space-y-5 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Course Title</label>
                  <input
                    type="text" required
                    className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-indigo-500"
                    value={courseEditData.title}
                    onChange={(e) => setCourseEditData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Duration (days/hours)</label>
                  <input
                    type="number" required
                    className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-indigo-500"
                    value={courseEditData.duration}
                    onChange={(e) => setCourseEditData(prev => ({ ...prev, duration: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={6}
                    className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-indigo-500"
                    value={courseEditData.description}
                    onChange={(e) => setCourseEditData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2 pb-2.5 text-sm font-semibold text-white hover:bg-indigo-500">Save Course</button>
                  <button type="button" onClick={() => setIsEditingCourse(false)} className="rounded-lg px-6 py-2 pb-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <AdminLessonViewer 
            lesson={selectedLesson} 
            onUpdate={handleUpdateLesson}
            onDelete={handleDeleteLesson}
            onClose={() => setSelectedLesson(null)}
          />
        )}
      </div>
    </div>
  );
}

export default AdminCourseDetailPage;
