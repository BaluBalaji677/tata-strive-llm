import { useState, useEffect } from "react";
import StatCard from "../../components/StatCard";
import { getAuth } from "../../utils/token";

function PrincipalAnalyticsPage() {
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
        <h1 className="text-3xl font-bold text-white">System Analytics</h1>
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
      <h1 className="text-3xl font-bold text-white">System Analytics</h1>

      {/* Key Metrics */}
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

      {/* Analytics Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Overview */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            System Overview
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active Principals</span>
              <span className="text-2xl font-bold text-white">
                {analytics?.totalPrincipals || 1}
              </span>
            </div>
            <div className="border-t border-white/10" />
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Teacher-to-Student Ratio</span>
              <span className="text-2xl font-bold text-white">
                {analytics?.totalStudents && analytics?.totalAdmins
                  ? (analytics.totalStudents / Math.max(analytics.totalAdmins, 1)).toFixed(1)
                  : "N/A"}
              </span>
            </div>
            <div className="border-t border-white/10" />
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Avg Students per Course</span>
              <span className="text-2xl font-bold text-white">
                {analytics?.totalStudents && analytics?.totalCourses
                  ? (analytics.totalStudents / Math.max(analytics.totalCourses, 1)).toFixed(1)
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Attendance Summary
          </h2>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Markings</p>
              <p className="text-3xl font-bold text-white">
                {analytics?.totalAttendanceMarkings || 0}
              </p>
            </div>
            <div className="text-gray-400 text-sm">
              <p>Last Updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Students/Teacher</p>
            <p className="text-2xl font-bold text-emerald-400">
              {analytics?.totalStudents && analytics?.totalAdmins
                ? (analytics.totalStudents / Math.max(analytics.totalAdmins, 1)).toFixed(0)
                : "0"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Courses Active</p>
            <p className="text-2xl font-bold text-sky-400">
              {analytics?.totalCourses || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Attendance Rate</p>
            <p className="text-2xl font-bold text-orange-400">
              {analytics?.totalAttendanceMarkings ? "High" : "N/A"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">System Health</p>
            <p className="text-2xl font-bold text-green-400">✓ Good</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrincipalAnalyticsPage;
