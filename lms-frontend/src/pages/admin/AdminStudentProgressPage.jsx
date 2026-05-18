import { useEffect, useState } from "react";
import { getAdminStudentProgress } from "../../services/progressService";
import Card from "../../components/common/Card";

const progressColors = [
  "from-sky-500 to-cyan-400",
  "from-violet-500 to-fuchsia-500",
  "from-emerald-500 to-lime-400",
  "from-orange-500 to-amber-400",
];

const AdminStudentProgressPage = () => {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminStudentProgress();
        setProgress(data);
      } catch (err) {
        setError("Failed to load student progress.");
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Student Progress</h1>
        <p className="text-sm text-slate-300">View course completion stats for all students.</p>
      </div>

      {error ? (
        <Card className="text-rose-300">{error}</Card>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item} className="animate-pulse">
              <div className="h-4 w-3/4 rounded bg-white/20 mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded bg-white/10" />
                <div className="h-4 w-full rounded bg-white/10" />
                <div className="h-4 w-5/6 rounded bg-white/10" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {progress.map((student, index) => (
            <Card key={student.studentId} className="overflow-hidden">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">{student.fullName || student.username || student.rollNumber}</h2>
                  <p className="text-sm text-slate-400">
                    Roll: {student.rollNumber} · Email: {student.username || "-"}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="rounded-full bg-slate-800 px-3 py-1">Courses: {student.courses.length}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {student.courses.map((course, courseIndex) => (
                  <div key={course.courseId} className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-xl shadow-slate-950/20">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-white truncate">{course.courseTitle}</h3>
                        <p className="text-xs text-slate-500">{course.completedLessons} / {course.totalLessons} lessons</p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-400">{course.percentage}%</span>
                    </div>

                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${progressColors[courseIndex % progressColors.length]}`}
                        style={{ width: `${course.percentage}%` }}
                      />
                    </div>
                    <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {course.percentage >= 100 ? "Completed" : course.percentage >= 75 ? "Almost there" : "In progress"}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminStudentProgressPage;
