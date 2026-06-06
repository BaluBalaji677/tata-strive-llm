import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentQuizzes } from "../../api/studentQuizApi";
import Card from "../../components/common/Card";

function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getStudentQuizzes();
      setQuizzes(data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load assigned quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assigned Quizzes</h1>
        <p className="text-sm text-slate-300">View and complete MCQ assessments assigned by your instructors.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/20 border border-rose-500/30 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 animate-pulse rounded-2xl bg-white/10" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">No quizzes assigned to you at this moment.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            const isCompleted = quiz.status === "COMPLETED";

            return (
              <div
                key={quiz.quizId}
                className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-lg backdrop-blur-md hover:border-white/20 transition-all duration-300"
              >
                <div>
                  {/* Status Badge */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {quiz.courseTitle || "General"}
                    </span>
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {quiz.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{quiz.title}</h3>
                  <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                    {quiz.description || "No description provided."}
                  </p>
                </div>

                <div className="border-t border-white/5 pt-4 mt-auto flex items-center justify-between">
                  {isCompleted ? (
                    <div>
                      <p className="text-xs text-slate-400">Last Score</p>
                      <p className="text-lg font-bold text-sky-400">
                        {quiz.score} <span className="text-xs text-slate-400">/ {quiz.maxScore}</span>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-slate-400">Time Limit</p>
                      <p className="text-sm font-semibold text-slate-300">Untimed</p>
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/student/quiz/${quiz.quizId}`)}
                    className={`rounded-lg px-4 py-1.5 text-xs font-bold shadow-md transition-all duration-300 ${
                      isCompleted
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : "bg-sky-500 hover:bg-sky-400 text-white"
                    }`}
                  >
                    {isCompleted ? "Retake Quiz" : "Start Test"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentQuizzesPage;
