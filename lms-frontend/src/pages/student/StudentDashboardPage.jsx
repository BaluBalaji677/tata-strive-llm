import { useEffect, useState } from "react";
import StatCard from "../../components/StatCard";
import ProfileCard from "../../components/ProfileCard";
import { getCourses } from "../../api/courseApi";
import { getStudentTasks } from "../../api/taskApi";
import { getStudentAttendanceSummary } from "../../api/attendanceApi";
import { getProfile } from "../../services/profileService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const attendanceTrendData = [
  { day: "Mon", attendance: 80 },
  { day: "Tue", attendance: 85 },
  { day: "Wed", attendance: 78 },
  { day: "Thu", attendance: 90 },
  { day: "Fri", attendance: 88 },
];

function StudentDashboardPage() {
  const [stats, setStats] = useState({
    courses: 0,
    pendingTasks: 0,
    completedTasks: 0,
    attendancePercentage: null,
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      const [coursesResult, tasksResult, attendanceResult, profileResult] = await Promise.allSettled([
        getCourses(),
        getStudentTasks(),
        getStudentAttendanceSummary(),
        getProfile()
      ]);

      const courses = coursesResult.status === "fulfilled" && Array.isArray(coursesResult.value)
        ? coursesResult.value.length
        : 0;

      const taskList = tasksResult.status === "fulfilled" && Array.isArray(tasksResult.value)
        ? tasksResult.value
        : [];

      const completedTasks = taskList.filter((task) => {
        const status = String(task?.status ?? "").toLowerCase();
        return status === "completed" || status === "done";
      }).length;
      const pendingTasks = Math.max(taskList.length - completedTasks, 0);

      const attendancePercentage = attendanceResult.status === "fulfilled"
        ? (attendanceResult.value?.percentage ?? null)
        : null;

      setStats({
        courses,
        pendingTasks,
        completedTasks,
        attendancePercentage,
      });
      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value);
      }
      setLoading(false);
    };

    loadDashboard().catch(() => {
      setStats({
        courses: 0,
        pendingTasks: 0,
        completedTasks: 0,
        attendancePercentage: null,
      });
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <p className="text-sm text-slate-300">Your quick overview for today.</p>
      </div>
      {loading ? <p className="text-sm text-slate-300">Loading dashboard...</p> : null}

      {/* Profile Card Section */}
      {!loading && profile && (
        <ProfileCard
          profile={profile}
          stats={[
            { label: "Attendance", value: typeof stats.attendancePercentage === "number" ? `${stats.attendancePercentage}%` : "0%" },
            { label: "Tasks Done", value: stats.completedTasks },
            { label: "Courses", value: stats.courses }
          ]}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Courses" value={stats.courses} />
        <StatCard title="Pending Tasks" value={stats.pendingTasks} />
        <StatCard title="Completed Tasks" value={stats.completedTasks} />
        <StatCard
          title="Attendance %"
          value={
            typeof stats.attendancePercentage === "number"
              ? `${stats.attendancePercentage}%`
              : "N/A"
          }
        />
      </div>

      <div className="glass rounded-2xl p-4">
        <p className="text-sm text-slate-300">Attendance Trend</p>
        {attendanceTrendData.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No attendance trend data available.</p>
        ) : (
          <div className="mt-3 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#cbd5e1" />
                <YAxis domain={[0, 100]} stroke="#cbd5e1" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboardPage;

