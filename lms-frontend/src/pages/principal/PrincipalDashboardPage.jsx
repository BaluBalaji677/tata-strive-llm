import { useState, useEffect } from "react";
import StatCard from "../../components/StatCard";
import { getAuth } from "../../utils/token";

function PrincipalDashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const auth = getAuth();
      const response = await fetch("/api/principal/analytics/dashboard", {
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Principal Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-white/10 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Principal Dashboard</h1>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon="👥"
          label="Total Students"
          value={analytics?.totalStudents || 0}
          color="blue"
        />
        <StatCard
          icon="👨‍🏫"
          label="Total Teachers"
          value={analytics?.totalAdmins || 0}
          color="purple"
        />
        <StatCard
          icon="📚"
          label="Total Courses"
          value={analytics?.totalCourses || 0}
          color="emerald"
        />
        <StatCard
          icon="📋"
          label="Attendance Records"
          value={analytics?.totalAttendanceMarkings || 0}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a
            href="/principal/teachers"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 transition-transform rounded-lg p-4 text-white font-semibold text-center"
          >
            👨‍💼 Manage Teachers
          </a>
          <a
            href="/principal/students"
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:scale-105 transition-transform rounded-lg p-4 text-white font-semibold text-center"
          >
            👥 View Students
          </a>
          <a
            href="/principal/courses"
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-105 transition-transform rounded-lg p-4 text-white font-semibold text-center"
          >
            📚 View Courses
          </a>
          <a
            href="/principal/analytics"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:scale-105 transition-transform rounded-lg p-4 text-white font-semibold text-center"
          >
            📊 Analytics
          </a>
        </div>
      </div>
    </div>
  );
}

export default PrincipalDashboardPage;
