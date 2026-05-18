import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  getCourseById,
  updateAdminCourse,
  deleteAdminCourse,
  addModule,
  updateModule,
  deleteModule,
  addLesson,
  updateLesson,
  deleteLesson,
} from "../../services/courseService";
import { deleteModuleTask, getTasksByModule } from "../../api/moduleTaskApi";
import { getCourseCertificate, uploadCourseCertificate } from "../../api/certificateApi";
import AdminModuleAccordion from "../../components/admin/AdminModuleAccordion";
import AdminLessonViewer from "../../components/admin/AdminLessonViewer";
import AdminTaskViewer from "../../components/admin/AdminTaskViewer";
import ModuleTaskFormModal from "../../components/admin/ModuleTaskFormModal";

const normalizeCourseData = (data) => ({
  ...data,
  modules: Array.isArray(data?.modules)
    ? data.modules.map((module) => ({
        ...module,
        lessons: Array.isArray(module?.lessons) ? module.lessons : [],
      }))
    : [],
});

const isAllowedCertificateFile = (file) => {
  if (!file) return false;
  const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
  return allowedTypes.includes(file.type);
};

function AdminCourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moduleTasks, setModuleTasks] = useState({});
  const [taskLoadingByModule, setTaskLoadingByModule] = useState({});
  const [taskErrorByModule, setTaskErrorByModule] = useState({});

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseEditData, setCourseEditData] = useState({ title: "", description: "", duration: "" });

  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedModuleIdForTask, setSelectedModuleIdForTask] = useState(null);
  const [taskModalMode, setTaskModalMode] = useState("create");
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
  const [taskPendingDelete, setTaskPendingDelete] = useState(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const [certificate, setCertificate] = useState(null);
  const [certificateName, setCertificateName] = useState("");
  const [certificateFile, setCertificateFile] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [certificateError, setCertificateError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const totalTaskCount = useMemo(
    () => Object.values(moduleTasks).reduce((count, tasks) => count + (Array.isArray(tasks) ? tasks.length : 0), 0),
    [moduleTasks]
  );

  const fetchCourseCertificate = async (courseId) => {
    try {
      const response = await getCourseCertificate(courseId);
      setCertificate(response);
    } catch (error) {
      if (error?.response?.status !== 404) {
        console.error("Failed to fetch certificate", error);
      }
      setCertificate(null);
    }
  };

  const fetchTasksForModule = async (moduleId) => {
    if (!moduleId) return [];

    setTaskLoadingByModule((prev) => ({ ...prev, [moduleId]: true }));
    setTaskErrorByModule((prev) => ({ ...prev, [moduleId]: "" }));

    try {
      const tasks = await getTasksByModule(moduleId);
      console.log("[Admin Task] fetched tasks response", tasks);
      console.log("[Admin Task] fetched module ID", moduleId);
      setModuleTasks((prev) => ({ ...prev, [moduleId]: Array.isArray(tasks) ? tasks : [] }));
      return Array.isArray(tasks) ? tasks : [];
    } catch (error) {
      console.error(`Failed to fetch tasks for module ${moduleId}`, error);
      setTaskErrorByModule((prev) => ({ ...prev, [moduleId]: "Failed to load tasks." }));
      return [];
    } finally {
      setTaskLoadingByModule((prev) => ({ ...prev, [moduleId]: false }));
    }
  };

  const fetchTasksForModules = async (modules) => {
    const safeModules = Array.isArray(modules) ? modules : [];
    await Promise.all(safeModules.map((module) => fetchTasksForModule(module?.id)));
  };

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const data = normalizeCourseData(await getCourseById(id));
      setCourse(data);
      await Promise.all([
        fetchTasksForModules(data.modules),
        fetchCourseCertificate(id),
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id]);

  const handleEditCourseStart = () => {
    setCourseEditData({
      title: course?.title || course?.name || "",
      description: course?.description || "",
      duration: course?.duration || 0,
    });
    setSelectedLesson(null);
    setSelectedTask(null);
    setIsEditingCourse(true);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateAdminCourse(id, courseEditData);
      setCourse((prev) => normalizeCourseData({ ...prev, ...updated }));
      setIsEditingCourse(false);
      setToast({ type: "success", message: "Course updated successfully." });
    } catch {
      setToast({ type: "error", message: "Failed to update course." });
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm("Are you sure you want to delete this entire course?")) return;
    try {
      await deleteAdminCourse(id);
      navigate("/admin/courses");
    } catch {
      setToast({ type: "error", message: "Failed to delete course." });
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    try {
      const added = await addModule({ courseId: Number(id), title: newModuleTitle });
      const nextModule = { ...added, lessons: [] };
      setCourse((prev) => ({
        ...prev,
        modules: [...(prev?.modules || []), nextModule],
      }));
      setModuleTasks((prev) => ({ ...prev, [added?.id]: [] }));
      setNewModuleTitle("");
      setIsAddingModule(false);
      setToast({ type: "success", message: "Module added successfully." });
    } catch {
      setToast({ type: "error", message: "Failed to add module." });
    }
  };

  const handleUpdateModule = async (moduleId, title) => {
    try {
      const updated = await updateModule(moduleId, title);
      setCourse((prev) => ({
        ...prev,
        modules: (prev?.modules || []).map((module) =>
          module?.id === moduleId ? { ...module, title: updated?.title ?? title } : module
        ),
      }));
      setToast({ type: "success", message: "Module updated successfully." });
    } catch {
      setToast({ type: "error", message: "Failed to update module." });
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm("Delete this module and all its lessons?")) return;
    try {
      await deleteModule(moduleId);
      setCourse((prev) => ({
        ...prev,
        modules: (prev?.modules || []).filter((module) => module?.id !== moduleId),
      }));
      setModuleTasks((prev) => {
        const next = { ...prev };
        delete next[moduleId];
        return next;
      });
      setToast({ type: "success", message: "Module deleted successfully." });
    } catch {
      setToast({ type: "error", message: "Failed to delete module." });
    }
  };

  const handleAddTask = (moduleId) => {
    setSelectedModuleIdForTask(moduleId);
    setSelectedTaskForEdit(null);
    setTaskModalMode("create");
    setSelectedLesson(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    setSelectedTaskForEdit(task ?? null);
    setSelectedModuleIdForTask(task?.moduleId ?? null);
    setTaskModalMode("edit");
    setShowTaskModal(true);
  };

  const handleTaskSelect = (task) => {
    setSelectedTask(task ?? null);
    setSelectedLesson(null);
    setIsEditingCourse(false);
  };

  const handleTaskSaved = async (savedTask) => {
    const moduleId = savedTask?.moduleId ?? selectedModuleIdForTask;
    if (!moduleId) {
      await fetchCourse();
      return;
    }

    setModuleTasks((prev) => {
      const existing = Array.isArray(prev[moduleId]) ? prev[moduleId] : [];
      const deduped = existing.filter((task) => task?.id !== savedTask?.id);
      return { ...prev, [moduleId]: [...deduped, savedTask] };
    });

    await fetchTasksForModule(moduleId);
    setShowTaskModal(false);
    setSelectedTaskForEdit(null);
    setSelectedTask(savedTask);
    setSelectedLesson(null);
    setToast({ type: "success", message: taskModalMode === "edit" ? "Task updated successfully." : "Task created successfully." });
  };

  const handleDeleteTaskRequest = (task) => {
    setTaskPendingDelete(task ?? null);
  };

  const handleConfirmDeleteTask = async () => {
    const taskId = taskPendingDelete?.id;
    const moduleId = taskPendingDelete?.moduleId;
    if (!taskId || !moduleId) {
      setTaskPendingDelete(null);
      return;
    }

    setIsDeletingTask(true);
    try {
      await deleteModuleTask(taskId);
      setModuleTasks((prev) => ({
        ...prev,
        [moduleId]: (Array.isArray(prev?.[moduleId]) ? prev[moduleId] : []).filter((task) => task?.id !== taskId),
      }));
      setTaskPendingDelete(null);
      setSelectedTask((prev) => (prev?.id === taskId ? null : prev));
      setToast({ type: "success", message: "Task deleted successfully." });
    } catch (error) {
      console.error("Failed to delete task", error);
      setToast({ type: "error", message: "Failed to delete task." });
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleAddLesson = async (moduleId, payload) => {
    try {
      const added = await addLesson({ ...payload, moduleId });
      setCourse((prev) => ({
        ...prev,
        modules: (prev?.modules || []).map((module) =>
          module?.id === moduleId
            ? { ...module, lessons: [...(module?.lessons || []), added] }
            : module
        ),
      }));
      setSelectedLesson(added);
      setSelectedTask(null);
      setIsEditingCourse(false);
      setToast({ type: "success", message: "Lesson added successfully." });
    } catch {
      setToast({ type: "error", message: "Failed to add lesson." });
    }
  };

  const handleUpdateLesson = async (lessonId, payload) => {
    try {
      const updated = await updateLesson(lessonId, payload);
      setCourse((prev) => ({
        ...prev,
        modules: (prev?.modules || []).map((module) => ({
          ...module,
          lessons: (module?.lessons || []).map((lesson) =>
            lesson?.id === lessonId ? { ...lesson, ...updated } : lesson
          ),
        })),
      }));
      setSelectedLesson(updated);
      setSelectedTask(null);
      setToast({ type: "success", message: "Lesson updated successfully." });
    } catch {
      setToast({ type: "error", message: "Failed to update lesson." });
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Delete this lesson?")) return;
    try {
      await deleteLesson(lessonId);
      setCourse((prev) => ({
        ...prev,
        modules: (prev?.modules || []).map((module) => ({
          ...module,
          lessons: (module?.lessons || []).filter((lesson) => lesson?.id !== lessonId),
        })),
      }));
      if (selectedLesson?.id === lessonId) setSelectedLesson(null);
      setToast({ type: "success", message: "Lesson deleted successfully." });
    } catch {
      setToast({ type: "error", message: "Failed to delete lesson." });
    }
  };

  const handleCertificateUpload = async (e) => {
    e.preventDefault();
    setCertificateError("");

    if (!certificateName.trim()) {
      setCertificateError("Certificate title is required.");
      return;
    }

    if (!certificateFile) {
      setCertificateError("Please choose a PDF or image file.");
      return;
    }

    if (!isAllowedCertificateFile(certificateFile)) {
      setCertificateError("Only PDF, PNG, JPG, JPEG, and WEBP files are allowed.");
      return;
    }

    setCertificateLoading(true);
    try {
      const uploaded = await uploadCourseCertificate(id, certificateName.trim(), certificateFile);
      setCertificate(uploaded);
      setShowCertificateModal(false);
      setCertificateName("");
      setCertificateFile(null);
      setToast({ type: "success", message: "Certificate uploaded successfully." });
    } catch (error) {
      console.error("Certificate upload failed", error);
      setCertificateError(error?.response?.data?.message || "Failed to upload certificate.");
    } finally {
      setCertificateLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading course CMS...</div>;
  if (!course) return <div className="p-8 text-center text-rose-400">Course not found</div>;

  return (
    <div className="relative flex h-[calc(100vh-6rem)] w-full gap-6 overflow-hidden pl-4 pr-6">
      {toast && (
        <div
          className={`absolute right-8 top-4 z-50 rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur-xl ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
              : "border-rose-500/30 bg-rose-500/15 text-rose-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      <ModuleTaskFormModal
        isVisible={showTaskModal}
        moduleId={selectedModuleIdForTask}
        task={selectedTaskForEdit}
        mode={taskModalMode}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTaskForEdit(null);
        }}
        onTaskSaved={handleTaskSaved}
      />

      <AnimatePresence>
        {taskPendingDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="w-full max-w-md rounded-[28px] border border-white/10 bg-slate-900 p-6 shadow-2xl"
            >
              <h3 className="text-xl font-semibold text-white">Delete Task</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Are you sure you want to delete this task?
              </p>
              <p className="mt-2 rounded-2xl border border-rose-500/15 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {taskPendingDelete?.title ?? "Untitled Task"}
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTaskPendingDelete(null)}
                  className="inline-flex h-11 items-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-slate-300 transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteTask}
                  disabled={isDeletingTask}
                  className="inline-flex h-11 items-center rounded-2xl bg-rose-500 px-5 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingTask ? "Deleting..." : "Delete Task"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-300">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Upload Certificate</h3>
                <p className="text-sm text-slate-400">Attach a PDF or image certificate to this course.</p>
              </div>
            </div>

            <form onSubmit={handleCertificateUpload} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Certificate Title</label>
                <input
                  type="text"
                  value={certificateName}
                  onChange={(e) => setCertificateName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 p-3 text-white outline-none focus:border-amber-400/50"
                  placeholder="Course Completion Certificate"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Certificate File</label>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => setCertificateFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-2xl border border-dashed border-white/15 bg-black/20 p-3 text-sm text-slate-300 outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white hover:file:bg-white/15"
                />
              </div>

              {certificateError && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {certificateError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCertificateModal(false)}
                  className="rounded-2xl px-4 py-2 text-slate-300 transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={certificateLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  {certificateLoading ? "Uploading..." : "Upload Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex w-[370px] max-w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="border-b border-white/10 bg-white/5 p-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <Link to="/admin/courses" className="hover:text-indigo-300">Courses</Link> &rarr; CMS
          </div>
          <h2 className="truncate text-xl font-bold text-white" title={course?.title || course?.name}>
            {course?.title || course?.name}
          </h2>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleEditCourseStart}
              className="flex-1 rounded-lg bg-indigo-500/20 py-2 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/30"
            >
              Edit Course
            </button>
            <button
              onClick={handleDeleteCourse}
              className="rounded-lg bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/30"
            >
              Delete
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-500/15 bg-amber-500/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Certificate</p>
                <h3 className="mt-2 text-sm font-semibold text-white">
                  {certificate?.certificateName || "No certificate uploaded yet"}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {certificate?.uploadedAt
                    ? `Uploaded ${new Date(certificate.uploadedAt).toLocaleString()}`
                    : "Students with PASS status will be able to download it."}
                </p>
              </div>
              {certificate?.certificateUrl && (
                <a
                  href={`http://localhost:8080${certificate.certificateUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white transition hover:bg-white/15"
                >
                  View
                </a>
              )}
            </div>
            <button
              onClick={() => setShowCertificateModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Upload Certificate
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase text-slate-300">Curriculum</h3>
            <button
              onClick={() => setIsAddingModule((prev) => !prev)}
              className="text-xs font-bold text-emerald-400 transition hover:text-emerald-300"
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
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className="mb-2 w-full rounded-md border border-white/20 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-400"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAddingModule(false)} className="text-xs text-slate-300">Cancel</button>
                  <button type="submit" className="text-xs font-bold text-emerald-400">Save</button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4 pb-8">
            {(course?.modules || []).length === 0 ? (
              <p className="text-sm italic text-slate-500">No modules. Create one to begin.</p>
            ) : (
              (course?.modules || []).map((module, moduleIndex) => (
                <AdminModuleAccordion
                  key={module?.id ?? `module-${moduleIndex}`}
                  module={module}
                  index={moduleIndex}
                  selectedLessonId={selectedLesson?.id}
                  selectedTaskId={selectedTask?.id}
                  onEditUpdate={handleUpdateModule}
                  onDelete={handleDeleteModule}
                  onAddLesson={handleAddLesson}
                  onAddTask={handleAddTask}
                  onSelectLesson={(lesson) => {
                    setSelectedLesson(lesson);
                    setSelectedTask(null);
                    setIsEditingCourse(false);
                  }}
                  onSelectTask={(task) => {
                    handleTaskSelect(task);
                    setIsEditingCourse(false);
                  }}
                  tasks={moduleTasks?.[module?.id] || []}
                  tasksLoading={Boolean(taskLoadingByModule[module?.id])}
                  taskError={taskErrorByModule[module?.id] || ""}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <div className="mb-4 rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(2,6,23,0.92))] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Admin Workspace</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Manage lessons, coding tasks, and course certificate</h3>
              <p className="mt-1 text-sm text-slate-400">
                New tasks should appear instantly under the correct module without a page refresh.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Modules</div>
                <div className="mt-1 text-lg font-semibold text-white">{course?.modules?.length || 0}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Tasks</div>
                <div className="mt-1 text-lg font-semibold text-white">{totalTaskCount}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-full flex-1 overflow-hidden">
          {isEditingCourse ? (
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="border-b border-white/10 bg-black/20 p-5">
                <h2 className="text-xl font-bold text-slate-100">Edit Course Details</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin hover:scrollbar-thumb-white/10">
                <form onSubmit={handleUpdateCourse} className="max-w-2xl space-y-5">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Course Title</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-indigo-500"
                      value={courseEditData.title}
                      onChange={(e) => setCourseEditData((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Duration (days/hours)</label>
                    <input
                      type="number"
                      required
                      className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-indigo-500"
                      value={courseEditData.duration}
                      onChange={(e) => setCourseEditData((prev) => ({ ...prev, duration: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Description</label>
                    <textarea
                      rows={6}
                      className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-indigo-500"
                      value={courseEditData.description}
                      onChange={(e) => setCourseEditData((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2 pb-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
                      Save Course
                    </button>
                    <button type="button" onClick={() => setIsEditingCourse(false)} className="rounded-lg px-6 py-2 pb-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : selectedTask ? (
            <AdminTaskViewer
              task={selectedTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTaskRequest}
              onClose={() => setSelectedTask(null)}
            />
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
    </div>
  );
}

export default AdminCourseDetailPage;
