import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStudentQuizDetails, submitStudentQuiz } from "../../api/studentQuizApi";
import Card from "../../components/common/Card";

function StudentQuizActivePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({}); // questionId -> "A", "B", "C", "D"
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Result Screen State
  const [result, setResult] = useState(null); // { score, maxScore }

  const loadQuizDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getStudentQuizDetails(id);
      setQuiz(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load quiz questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizDetails();
  }, [id]);

  const selectOption = (questionId, optionKey) => {
    setAnswers({
      ...answers,
      [questionId]: optionKey,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // Check if student has answered all questions
    const unansweredCount = quiz.questions.filter((q) => !answers[q.id]).length;
    if (unansweredCount > 0) {
      if (!window.confirm(`You have left ${unansweredCount} questions unanswered. Do you want to submit anyway?`)) {
        return;
      }
    } else {
      if (!window.confirm("Are you sure you want to submit your answers?")) {
        return;
      }
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await submitStudentQuiz(id, { answers });
      setResult(response);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit answers.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
        <p className="text-sm text-slate-300">Loading quiz questions, please wait...</p>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <Card>
        <div className="text-center py-6">
          <p className="text-sm text-rose-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/student/quizzes")}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm text-white"
          >
            Back to Quizzes
          </button>
        </div>
      </Card>
    );
  }

  // Result screen after successful submission
  if (result) {
    const percentage = Math.round((result.score / result.maxScore) * 100);
    let gradeLabel = "Keep Practicing!";
    let colorClass = "text-amber-400";

    if (percentage >= 80) {
      gradeLabel = "Excellent Work!";
      colorClass = "text-emerald-400";
    } else if (percentage >= 50) {
      gradeLabel = "Good Job!";
      colorClass = "text-sky-400";
    }

    return (
      <div className="mx-auto max-w-xl py-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sky-500/10 text-4xl">
            🎉
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Quiz Submitted!</h2>
          <p className="text-slate-300 mb-6">Your answers have been graded automatically on the server.</p>

          <div className="mb-6 rounded-2xl bg-black/40 p-6 border border-white/5">
            <p className="text-sm text-slate-400 mb-1">Your Total Score</p>
            <p className={`text-4xl font-extrabold ${colorClass}`}>
              {result.score} <span className="text-lg text-slate-400">/ {result.maxScore}</span>
            </p>
            <p className="text-xs text-slate-300 mt-2">Percentage: {percentage}%</p>
            <p className={`mt-3 text-sm font-semibold ${colorClass}`}>{gradeLabel}</p>
          </div>

          <button
            onClick={() => navigate("/student/quizzes")}
            className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-sky-400 transition"
          >
            Done & Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = quiz.questions ? quiz.questions.length : 0;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Quiz Header */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
            {quiz.courseTitle || "General Assessment"}
          </span>
          <span className="text-xs font-semibold text-slate-300">
            {answeredCount} of {totalQuestions} answered
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-white mt-2 mb-3">{quiz.title}</h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          {quiz.description || "Answer the following multiple-choice questions. Take your time, there is no time limit."}
        </p>

        {/* Progress bar */}
        {totalQuestions > 0 && (
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mt-4">
            <div
              className="h-full bg-sky-400 transition-all duration-300"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/20 border border-rose-500/30 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {quiz.questions && quiz.questions.map((q, index) => {
          const selectedOption = answers[q.id];

          return (
            <div
              key={q.id}
              className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-sm space-y-4"
            >
              <div className="flex gap-2">
                <span className="font-bold text-sky-400">Q{index + 1}.</span>
                <h3 className="font-medium text-white text-base leading-relaxed">{q.question}</h3>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { key: "A", text: q.optionA },
                  { key: "B", text: q.optionB },
                  { key: "C", text: q.optionC },
                  { key: "D", text: q.optionD },
                ].map((opt) => {
                  const isSelected = selectedOption === opt.key;

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => selectOption(q.id, opt.key)}
                      className={`flex items-start rounded-xl border p-4 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-sky-500 bg-sky-500/10 text-white shadow-inner"
                          : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isSelected ? "bg-sky-500 text-white" : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="text-sm">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Submit Section */}
        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Discard draft and return to quizzes list?")) {
                navigate("/student/quizzes");
              }
            }}
            className="rounded-xl border border-white/25 bg-transparent px-6 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 transition"
          >
            Cancel & Exit
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-sky-500 px-8 py-2.5 text-sm font-extrabold text-white shadow-md hover:bg-sky-400 disabled:opacity-50 transition"
          >
            {submitting ? "Submitting..." : "Submit Assessment"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default StudentQuizActivePage;
