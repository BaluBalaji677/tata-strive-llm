import { useEffect, useState } from "react";
import {
  getAdminQuizzes,
  createAdminQuiz,
  updateAdminQuiz,
  deleteAdminQuiz,
  getQuizSubmissions,
  getQuizAnalytics,
  getAdminQuizDetails,
} from "../../api/adminQuizApi";
import { getCourses } from "../../services/courseService";
import { getAllStudents } from "../../services/studentService";
import Card from "../../components/common/Card";

function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState("quizzes"); // "quizzes" or "submissions"

  // Filter States (Quizzes)
  const [quizSearchTitle, setQuizSearchTitle] = useState("");
  const [quizFilterCourse, setQuizFilterCourse] = useState("");
  const [quizPage, setQuizPage] = useState(0);
  const [quizTotalPages, setQuizTotalPages] = useState(0);
  const [quizTotalElements, setQuizTotalElements] = useState(0);

  // Filter States (Submissions)
  const [subFilterQuiz, setSubFilterQuiz] = useState("");
  const [subFilterStudent, setSubFilterStudent] = useState("");
  const [subPage, setSubPage] = useState(0);
  const [subTotalPages, setSubTotalPages] = useState(0);
  const [subTotalElements, setSubTotalElements] = useState(0);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null); // { id, title, description, allowMultipleSubmissions, questions }
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(null); // quizId

  // Form States (Create / Edit)
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCourseId, setFormCourseId] = useState("");
  const [formAllowMultiple, setFormAllowMultiple] = useState(false);
  const [formAssignTo, setFormAssignTo] = useState("ALL"); // ALL, COURSE, SINGLE
  const [formStudentId, setFormStudentId] = useState("");
  const [formQuestions, setFormQuestions] = useState([
    { question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" }
  ]);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState(null);

  // Status Message States
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

  const loadQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: quizPage,
        size: 10,
        title: quizSearchTitle || undefined,
        courseId: quizFilterCourse || undefined,
      };
      const res = await getAdminQuizzes(params);
      setQuizzes(res.content || []);
      setQuizTotalPages(res.totalPages || 0);
      setQuizTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: subPage,
        size: 10,
        quizId: subFilterQuiz || undefined,
        studentId: subFilterStudent || undefined,
      };
      const res = await getQuizSubmissions(params);
      setSubmissions(res.content || []);
      setSubTotalPages(res.totalPages || 0);
      setSubTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    if (activeTab === "quizzes") {
      loadQuizzes();
    } else {
      loadSubmissions();
    }
  }, [activeTab, quizPage, quizSearchTitle, quizFilterCourse, subPage, subFilterQuiz, subFilterStudent]);

  const showToast = (msg, isSuccess = true) => {
    if (isSuccess) {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setError(msg);
      setTimeout(() => setError(""), 4000);
    }
  };

  // Add Question to Form
  const addQuestion = () => {
    setFormQuestions([
      ...formQuestions,
      { question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" }
    ]);
  };

  // Remove Question from Form
  const removeQuestion = (index) => {
    if (formQuestions.length === 1) {
      showToast("Quiz must contain at least one question", false);
      return;
    }
    const updated = formQuestions.filter((_, idx) => idx !== index);
    setFormQuestions(updated);
  };

  // Update Specific Question Field
  const updateQuestionField = (index, field, value) => {
    const updated = formQuestions.map((q, idx) => {
      if (idx === index) {
        return { ...q, [field]: value };
      }
      return q;
    });
    setFormQuestions(updated);
  };

  // Handle Quiz Creation Submit
  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast("Quiz Title is required", false);
      return;
    }
    // Validate questions
    for (let i = 0; i < formQuestions.length; i++) {
      const q = formQuestions[i];
      if (!q.question.trim() || !q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
        showToast(`Please fill out all fields for Question ${i + 1}`, false);
        return;
      }
    }

    try {
      const payload = {
        title: formTitle,
        description: formDescription,
        courseId: formCourseId ? Number(formCourseId) : null,
        allowMultipleSubmissions: formAllowMultiple,
        questions: formQuestions,
        assignTo: formAssignTo,
        studentId: formAssignTo === "SINGLE" && formStudentId ? Number(formStudentId) : null,
      };

      await createAdminQuiz(payload);
      showToast("Quiz created and assigned successfully");
      setShowCreateModal(false);
      resetForm();
      setQuizPage(0);
      loadQuizzes();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to create quiz", false);
    }
  };

  // Edit Quiz details
  const startEditQuiz = async (quizItem) => {
    try {
      const details = await getAdminQuizDetails(quizItem.id);
      setEditingQuiz(details);
      setFormTitle(details.title);
      setFormDescription(details.description || "");
      setFormCourseId(details.courseId || "");
      setFormAllowMultiple(details.allowMultipleSubmissions || false);
      setFormQuestions(details.questions && details.questions.length > 0 
        ? details.questions 
        : [{ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" }]
      );
    } catch (err) {
      showToast("Failed to load quiz details for editing", false);
    }
  };

  const handleUpdateQuiz = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast("Quiz Title is required", false);
      return;
    }
    for (let i = 0; i < formQuestions.length; i++) {
      const q = formQuestions[i];
      if (!q.question.trim() || !q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
        showToast(`Please fill out all fields for Question ${i + 1}`, false);
        return;
      }
    }

    try {
      const payload = {
        title: formTitle,
        description: formDescription,
        allowMultipleSubmissions: formAllowMultiple,
        questions: formQuestions.map(q => ({
          id: q.id || null,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
        })),
      };

      await updateAdminQuiz(editingQuiz.id, payload);
      showToast("Quiz updated successfully");
      setEditingQuiz(null);
      resetForm();
      loadQuizzes();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update quiz", false);
    }
  };

  // Delete/Deactivate Quiz
  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz? Student submissions will remain accessible, but the quiz itself will be deactivated.")) {
      return;
    }
    try {
      await deleteAdminQuiz(quizId);
      showToast("Quiz deactivated successfully");
      loadQuizzes();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to delete quiz", false);
    }
  };

  // Load Quiz attempt statistics
  const handleShowAnalytics = async (quizId) => {
    try {
      const stats = await getQuizAnalytics(quizId);
      setAnalyticsData(stats);
      setShowAnalyticsModal(quizId);
    } catch (err) {
      showToast("Failed to load statistics", false);
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormCourseId("");
    setFormAllowMultiple(false);
    setFormAssignTo("ALL");
    setFormStudentId("");
    setFormQuestions([{ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" }]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Quiz & Assessment Management</h1>
          <p className="text-sm text-slate-300">Create tests, manage questions, assign assessments, and track student scores.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="rounded-lg bg-sky-500/80 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-sky-500"
        >
          Create & Assign Quiz
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

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-white/10 pb-1">
        <button
          onClick={() => setActiveTab("quizzes")}
          className={`pb-2 px-1 text-sm font-semibold transition ${
            activeTab === "quizzes" ? "border-b-2 border-sky-400 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Quizzes List
        </button>
        <button
          onClick={() => setActiveTab("submissions")}
          className={`pb-2 px-1 text-sm font-semibold transition ${
            activeTab === "submissions" ? "border-b-2 border-sky-400 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Student Submissions
        </button>
      </div>

      {/* QUIZZES TAB */}
      {activeTab === "quizzes" && (
        <>
          {/* Filters */}
          <Card title="Search & Filter Quizzes">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Search Title</label>
                <input
                  type="text"
                  value={quizSearchTitle}
                  onChange={(e) => {
                    setQuizSearchTitle(e.target.value);
                    setQuizPage(0);
                  }}
                  placeholder="Keyword search..."
                  className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-1.5 text-sm text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Filter by Course</label>
                <select
                  value={quizFilterCourse}
                  onChange={(e) => {
                    setQuizFilterCourse(e.target.value);
                    setQuizPage(0);
                  }}
                  className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-1.5 text-sm text-white focus:outline-none"
                >
                  <option value="">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Quizzes Table */}
          <Card>
            {loading ? (
              <div className="space-y-4 py-8">
                <div className="h-4 w-1/3 animate-pulse rounded bg-white/20" />
                <div className="h-10 w-full animate-pulse rounded bg-white/10" />
                <div className="h-10 w-full animate-pulse rounded bg-white/10" />
              </div>
            ) : quizzes.length === 0 ? (
              <p className="text-center text-sm text-slate-300 py-8">No quizzes found.</p>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-300">
                        <th className="pb-3 pr-4 font-semibold">Title</th>
                        <th className="pb-3 pr-4 font-semibold">Course</th>
                        <th className="pb-3 pr-4 font-semibold">Created By</th>
                        <th className="pb-3 pr-4 font-semibold">Multiple Attempts</th>
                        <th className="pb-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizzes.map((quiz) => (
                        <tr key={quiz.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-3 pr-4 font-medium text-white">{quiz.title}</td>
                          <td className="py-3 pr-4 text-slate-300">{quiz.courseTitle || "Global (All Students)"}</td>
                          <td className="py-3 pr-4 text-slate-400">admin1</td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                                quiz.allowMultipleSubmissions
                                  ? "bg-sky-500/20 text-sky-300"
                                  : "bg-slate-500/20 text-slate-300"
                              }`}
                            >
                              {quiz.allowMultipleSubmissions ? "Allowed" : "No"}
                            </span>
                          </td>
                          <td className="py-3 text-right space-x-3">
                            <button
                              onClick={() => handleShowAnalytics(quiz.id)}
                              className="text-xs text-emerald-400 hover:underline"
                            >
                              Analytics
                            </button>
                            <button
                              onClick={() => startEditQuiz(quiz)}
                              className="text-xs text-sky-300 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="text-xs text-rose-300 hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {quizTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 text-xs">
                    <span className="text-slate-300">
                      Showing Page {quizPage + 1} of {quizTotalPages} (Total: {quizTotalElements} quizzes)
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={quizPage === 0}
                        onClick={() => setQuizPage((p) => p - 1)}
                        className="rounded-lg bg-white/10 px-3 py-1.5 transition hover:bg-white/20 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        disabled={quizPage >= quizTotalPages - 1}
                        onClick={() => setQuizPage((p) => p + 1)}
                        className="rounded-lg bg-white/10 px-3 py-1.5 transition hover:bg-white/20 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </>
      )}

      {/* SUBMISSIONS TAB */}
      {activeTab === "submissions" && (
        <>
          {/* Filters */}
          <Card title="Search & Filter Submissions">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Filter by Quiz</label>
                <select
                  value={subFilterQuiz}
                  onChange={(e) => {
                    setSubFilterQuiz(e.target.value);
                    setSubPage(0);
                  }}
                  className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-1.5 text-sm text-white focus:outline-none"
                >
                  <option value="">All Quizzes</option>
                  {quizzes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Filter by Student</label>
                <select
                  value={subFilterStudent}
                  onChange={(e) => {
                    setSubFilterStudent(e.target.value);
                    setSubPage(0);
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
            </div>
          </Card>

          {/* Submissions Table */}
          <Card>
            {loading ? (
              <div className="space-y-4 py-8">
                <div className="h-4 w-1/3 animate-pulse rounded bg-white/20" />
                <div className="h-10 w-full animate-pulse rounded bg-white/10" />
                <div className="h-10 w-full animate-pulse rounded bg-white/10" />
              </div>
            ) : submissions.length === 0 ? (
              <p className="text-center text-sm text-slate-300 py-8">No submissions recorded.</p>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-300">
                        <th className="pb-3 pr-4 font-semibold">Quiz Title</th>
                        <th className="pb-3 pr-4 font-semibold">Student Name</th>
                        <th className="pb-3 pr-4 font-semibold">Roll Number</th>
                        <th className="pb-3 pr-4 font-semibold">Score</th>
                        <th className="pb-3 pr-4 font-semibold">Submission Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => (
                        <tr key={sub.submissionId} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-3 pr-4 font-medium text-white">{sub.quizTitle}</td>
                          <td className="py-3 pr-4 text-slate-200">{sub.studentName}</td>
                          <td className="py-3 pr-4 text-slate-400">{sub.studentRollNumber}</td>
                          <td className="py-3 pr-4 font-semibold text-sky-300">
                            {sub.score} / {sub.maxScore}
                          </td>
                          <td className="py-3 pr-4 text-slate-400">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {subTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 text-xs">
                    <span className="text-slate-300">
                      Showing Page {subPage + 1} of {subTotalPages} (Total: {subTotalElements} submissions)
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={subPage === 0}
                        onClick={() => setSubPage((p) => p - 1)}
                        className="rounded-lg bg-white/10 px-3 py-1.5 transition hover:bg-white/20 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        disabled={subPage >= subTotalPages - 1}
                        onClick={() => setSubPage((p) => p + 1)}
                        className="rounded-lg bg-white/10 px-3 py-1.5 transition hover:bg-white/20 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </>
      )}

      {/* CREATE QUIZ MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-white/20 bg-slate-900 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4">Create & Assign New Quiz</h3>
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Quiz Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Mid-term Java Fundamentals"
                  className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Explain topics covered, time rules, etc..."
                  rows="2"
                  className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Course Associated (Optional)</label>
                  <select
                    value={formCourseId}
                    onChange={(e) => setFormCourseId(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">No Course Linkage</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAllowMultiple}
                      onChange={(e) => setFormAllowMultiple(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-black/40 text-sky-500"
                    />
                    Allow Multiple Attempts
                  </label>
                </div>
              </div>

              {/* Assignment logic */}
              <div className="border-t border-white/10 pt-3">
                <label className="block text-xs font-semibold text-slate-300 mb-2">Assign To</label>
                <div className="flex gap-4 mb-2">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="assignTo"
                      checked={formAssignTo === "ALL"}
                      onChange={() => setFormAssignTo("ALL")}
                      className="h-4 w-4 text-sky-500"
                    />
                    All Students
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="assignTo"
                      checked={formAssignTo === "COURSE"}
                      onChange={() => setFormAssignTo("COURSE")}
                      className="h-4 w-4 text-sky-500"
                    />
                    Course Students
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="assignTo"
                      checked={formAssignTo === "SINGLE"}
                      onChange={() => setFormAssignTo("SINGLE")}
                      className="h-4 w-4 text-sky-500"
                    />
                    Selected Student
                  </label>
                </div>

                {formAssignTo === "COURSE" && (
                  <select
                    required
                    value={formCourseId}
                    onChange={(e) => setFormCourseId(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Select Course...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                )}

                {formAssignTo === "SINGLE" && (
                  <select
                    required
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
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

              {/* Dynamic Questions Builder */}
              <div className="border-t border-white/10 pt-4 space-y-4 max-h-[300px] overflow-y-auto pr-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white">Questions List</h4>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="rounded bg-sky-500/20 px-2.5 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/30"
                  >
                    + Add Question
                  </button>
                </div>

                {formQuestions.map((q, idx) => (
                  <div key={idx} className="rounded-lg bg-black/30 p-3 border border-white/5 space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-bold text-slate-300">Question {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Remove
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="e.g. What is the output of System.out.println(10 + 20)?"
                        value={q.question}
                        onChange={(e) => updateQuestionField(idx, "question", e.target.value)}
                        className="w-full rounded border border-white/10 bg-black/25 px-2 py-1 text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Option A"
                        value={q.optionA}
                        onChange={(e) => updateQuestionField(idx, "optionA", e.target.value)}
                        className="rounded border border-white/10 bg-black/25 px-2 py-1 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Option B"
                        value={q.optionB}
                        onChange={(e) => updateQuestionField(idx, "optionB", e.target.value)}
                        className="rounded border border-white/10 bg-black/25 px-2 py-1 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Option C"
                        value={q.optionC}
                        onChange={(e) => updateQuestionField(idx, "optionC", e.target.value)}
                        className="rounded border border-white/10 bg-black/25 px-2 py-1 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Option D"
                        value={q.optionD}
                        onChange={(e) => updateQuestionField(idx, "optionD", e.target.value)}
                        className="rounded border border-white/10 bg-black/25 px-2 py-1 text-xs text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Correct Option:</span>
                      <select
                        value={q.correctAnswer}
                        onChange={(e) => updateQuestionField(idx, "correctAnswer", e.target.value)}
                        className="rounded border border-white/10 bg-black/40 px-2 py-0.5 text-white"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500/80 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                >
                  Save & Assign Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT QUIZ MODAL */}
      {editingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-white/20 bg-slate-900 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4">Edit Quiz Details</h3>
            <form onSubmit={handleUpdateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Quiz Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows="2"
                  className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAllowMultiple}
                    onChange={(e) => setFormAllowMultiple(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-black/40 text-sky-500"
                  />
                  Allow Multiple Attempts
                </label>
              </div>

              {/* Dynamic Questions Builder */}
              <div className="border-t border-white/10 pt-4 space-y-4 max-h-[300px] overflow-y-auto pr-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white">Questions List</h4>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="rounded bg-sky-500/20 px-2.5 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/30"
                  >
                    + Add Question
                  </button>
                </div>

                {formQuestions.map((q, idx) => (
                  <div key={idx} className="rounded-lg bg-black/30 p-3 border border-white/5 space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-bold text-slate-300">Question {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Remove
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Question text"
                        value={q.question}
                        onChange={(e) => updateQuestionField(idx, "question", e.target.value)}
                        className="w-full rounded border border-white/10 bg-black/25 px-2 py-1 text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Option A"
                        value={q.optionA}
                        onChange={(e) => updateQuestionField(idx, "optionA", e.target.value)}
                        className="rounded border border-white/10 bg-black/25 px-2 py-1 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Option B"
                        value={q.optionB}
                        onChange={(e) => updateQuestionField(idx, "optionB", e.target.value)}
                        className="rounded border border-white/10 bg-black/25 px-2 py-1 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Option C"
                        value={q.optionC}
                        onChange={(e) => updateQuestionField(idx, "optionC", e.target.value)}
                        className="rounded border border-white/10 bg-black/25 px-2 py-1 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Option D"
                        value={q.optionD}
                        onChange={(e) => updateQuestionField(idx, "optionD", e.target.value)}
                        className="rounded border border-white/10 bg-black/25 px-2 py-1 text-xs text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Correct Option:</span>
                      <select
                        value={q.correctAnswer}
                        onChange={(e) => updateQuestionField(idx, "correctAnswer", e.target.value)}
                        className="rounded border border-white/10 bg-black/40 px-2 py-0.5 text-white"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingQuiz(null)}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500/80 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ANALYTICS MODAL */}
      {showAnalyticsModal && analyticsData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-1">Quiz Analytics</h3>
            <p className="text-sm font-medium text-sky-400 mb-4">{analyticsData.quizTitle}</p>
            
            <div className="space-y-3.5">
              <div className="flex justify-between text-sm text-slate-300">
                <span>Total Assigned Students:</span>
                <span className="font-semibold text-white">{analyticsData.totalAssigned}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-300">
                <span>Total Submissions:</span>
                <span className="font-semibold text-white">{analyticsData.totalSubmitted}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-300">
                <span>Average Score:</span>
                <span className="font-bold text-sky-300">
                  {analyticsData.averageScore.toFixed(1)} pts
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-300">
                <span>Highest Score Achieved:</span>
                <span className="font-bold text-emerald-400">
                  {analyticsData.highestScore} pts
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-300">
                <span>Lowest Score Achieved:</span>
                <span className="font-bold text-rose-400">
                  {analyticsData.lowestScore} pts
                </span>
              </div>

              {analyticsData.totalAssigned > 0 && (
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Participation Rate</span>
                    <span>
                      {Math.round((analyticsData.totalSubmitted / analyticsData.totalAssigned) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-sky-400"
                      style={{
                        width: `${(analyticsData.totalSubmitted / analyticsData.totalAssigned) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={() => {
                  setShowAnalyticsModal(null);
                  setAnalyticsData(null);
                }}
                className="rounded-lg bg-sky-500/80 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
              >
                Close Analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminQuizzesPage;
