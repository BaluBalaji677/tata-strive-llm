import { useEffect, useState } from "react";
import {
  getAdminTasks,
  createAdminTask,
  updateAdminTask,
  deleteAdminTask,
  getAdminTaskDetails,
} from "../../api/adminTaskApi";
import { getCourses } from "../../services/courseService";
import { getAllStudents } from "../../services/studentService";
import Card from "../../components/common/Card";

function AdminTasksPage() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  // Filter States
  const [searchTitle, setSearchTitle] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterStudent, setFilterStudent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDueDate, setFilterDueDate] = useState("");

  // Pagination States
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Form States (Create)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newCourseId, setNewCourseId] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [assignTo, setAssignTo] = useState("ALL"); // ALL, SINGLE

  // Form States (Edit)
  const [editingTask, setEditingTask] = useState(null); // { id, title, description, dueDate }
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  // Form States (Details/Metrics Modal)
  const [detailsTask, setDetailsTask] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadDropdowns = async () => {
    try {
      const cData = await getCourses();
      setCourses(Array.isArray(cData) ? cData : []);
      const sData = await getAllStudents();
      setStudents(Array.isArray(sData) ? sData : []);
    } catch (err) {
      console.error("Failed to load options", err);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        size: 10,
        title: searchTitle || undefined,
        courseId: filterCourse || undefined,
        studentId: filterStudent || undefined,
        status: filterStatus || undefined,
        dueDate: filterDueDate || undefined,
      };
      const res = await getAdminTasks(params);
      setAssignments(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch task assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [page, searchTitle, filterCourse, filterStudent, filterStatus, filterDueDate]);

  const showToast = (msg, isSuccess = true) => {
    if (isSuccess) {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setError(msg);
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast("Title is required", false);
      return;
    }
    try {
      const payload = {
        title: newTitle,
        description: newDescription,
        dueDate: newDueDate || null,
        courseId: newCourseId ? Number(newCourseId) : null,
        studentId: assignTo === "SINGLE" && newStudentId ? Number(newStudentId) : null,
        assignTo,
      };
      await createAdminTask(payload);
      showToast("Task assigned successfully");
      setShowCreateModal(false);
      // Reset form
      setNewTitle("");
      setNewDescription("");
      setNewDueDate("");
      setNewCourseId("");
      setNewStudentId("");
      setAssignTo("ALL");
      setPage(0);
      loadTasks();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to create task", false);
    }
  };

  const handleStartEdit = (taskAssignment) => {
    setEditingTask({
      id: taskAssignment.taskId,
      title: taskAssignment.title,
      description: taskAssignment.description,
      dueDate: taskAssignment.dueDate || "",
    });
    setEditTitle(taskAssignment.title);
    setEditDescription(taskAssignment.description || "");
    setEditDueDate(taskAssignment.dueDate || "");
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      showToast("Title is required", false);
      return;
    }
    try {
      await updateAdminTask(editingTask.id, {
        title: editTitle,
        description: editDescription,
        dueDate: editDueDate || null,
      });
      showToast("Task updated successfully");
      setEditingTask(null);
      loadTasks();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update task", false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to deactivate this task? All student assignments will be hidden.")) {
      return;
    }
    try {
      await deleteAdminTask(taskId);
      showToast("Task deactivated successfully");
      loadTasks();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to delete task", false);
    }
  };

  const handleShowDetails = async (taskId) => {
    try {
      const details = await getAdminTaskDetails(taskId);
      setDetailsTask(details);
    } catch (err) {
      showToast("Failed to fetch task metrics", false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Task Management</h1>
          <p className="text-sm text-slate-300">Assign, track and monitor student homework assignments.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-sky-500/80 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-sky-500"
        >
          Create & Assign Task
        </button>
      </div>

      {successMsg && (
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 p-3 text-sm text-emerald-300">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-rose-500/20 border border-rose-500/30 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Filters Card */}
      <Card title="Search & Filter Assignments">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Search Title</label>
            <input
              type="text"
              value={searchTitle}
              onChange={(e) => {
                setSearchTitle(e.target.value);
                setPage(0);
              }}
              placeholder="Type keyword..."
              className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-1.5 text-sm text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Filter by Course</label>
            <select
              value={filterCourse}
              onChange={(e) => {
                setFilterCourse(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-1.5 text-sm text-white focus:outline-none"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Filter by Student</label>
            <select
              value={filterStudent}
              onChange={(e) => {
                setFilterStudent(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-1.5 text-sm text-white focus:outline-none"
            >
              <option value="">All Students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.rollNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-1.5 text-sm text-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
            <input
              type="date"
              value={filterDueDate}
              onChange={(e) => {
                setFilterDueDate(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-1.5 text-sm text-white focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card>
        {loading ? (
          <div className="space-y-4 py-8">
            <div className="h-4 w-1/3 animate-pulse rounded bg-white/20" />
            <div className="h-10 w-full animate-pulse rounded bg-white/10" />
            <div className="h-10 w-full animate-pulse rounded bg-white/10" />
          </div>
        ) : assignments.length === 0 ? (
          <p className="text-center text-sm text-slate-300 py-8">No tasks found matching current filters.</p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-300">
                    <th className="pb-3 pr-4 font-semibold">Title</th>
                    <th className="pb-3 pr-4 font-semibold">Assigned Student</th>
                    <th className="pb-3 pr-4 font-semibold">Roll Number</th>
                    <th className="pb-3 pr-4 font-semibold">Due Date</th>
                    <th className="pb-3 pr-4 font-semibold">Status</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-3 pr-4 max-w-xs truncate">
                        <button
                          onClick={() => handleShowDetails(item.taskId)}
                          className="font-medium text-sky-400 hover:underline text-left"
                        >
                          {item.title}
                        </button>
                      </td>
                      <td className="py-3 pr-4">{item.studentName}</td>
                      <td className="py-3 pr-4">{item.studentRollNumber}</td>
                      <td className="py-3 pr-4">{item.dueDate || "No Due Date"}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            item.status === "COMPLETED"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="text-xs text-sky-300 hover:text-sky-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTask(item.taskId)}
                          className="text-xs text-rose-300 hover:text-rose-200 transition"
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 text-xs">
                <span className="text-slate-300">
                  Showing Page {page + 1} of {totalPages} (Total: {totalElements} items)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-lg bg-white/10 px-3 py-1.5 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg bg-white/10 px-3 py-1.5 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4">Create & Assign New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement React hooks assignment"
                  className="w-full rounded-lg border border-white/25 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide instructions here..."
                  rows="4"
                  className="w-full rounded-lg border border-white/25 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full rounded-lg border border-white/25 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Course (Optional)</label>
                  <select
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                    className="w-full rounded-lg border border-white/25 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">No Course Associated</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title || c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Assign To</label>
                <div className="flex gap-4 mb-2">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="assignTo"
                      checked={assignTo === "ALL"}
                      onChange={() => setAssignTo("ALL")}
                      className="h-4 w-4 border-white/25 bg-black/40 text-sky-500"
                    />
                    All Students
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="assignTo"
                      checked={assignTo === "SINGLE"}
                      onChange={() => setAssignTo("SINGLE")}
                      className="h-4 w-4 border-white/25 bg-black/40 text-sky-500"
                    />
                    Selected Student
                  </label>
                </div>

                {assignTo === "SINGLE" && (
                  <select
                    required
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    className="w-full rounded-lg border border-white/25 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Select Student...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.rollNumber})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4">Edit Task Properties</h3>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-white/25 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows="4"
                  className="w-full rounded-lg border border-white/25 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full rounded-lg border border-white/25 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Completion Metrics Modal */}
      {detailsTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-2">{detailsTask.title}</h3>
            <p className="text-xs text-slate-400 mb-4">Course: {detailsTask.courseTitle || "None"}</p>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-slate-200">
                <span>Description:</span>
                <span className="text-right text-slate-300 max-w-xs">{detailsTask.description || "No description"}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-200">
                <span>Due Date:</span>
                <span>{detailsTask.dueDate || "N/A"}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-200">
                <span>Total Assignments:</span>
                <span className="font-semibold text-white">{detailsTask.totalAssignments}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-200">
                <span>Completed Assignments:</span>
                <span className="font-semibold text-emerald-400">{detailsTask.completedAssignments}</span>
              </div>
              {detailsTask.totalAssignments > 0 && (
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Completion Rate</span>
                    <span>
                      {Math.round((detailsTask.completedAssignments / detailsTask.totalAssignments) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{
                        width: `${(detailsTask.completedAssignments / detailsTask.totalAssignments) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-6">
              <button
                onClick={() => setDetailsTask(null)}
                className="rounded-lg bg-sky-500/80 px-4 py-2 text-sm text-white transition hover:bg-sky-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTasksPage;
