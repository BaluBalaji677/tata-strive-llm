import { useState, useEffect } from "react";
import { getAuth } from "../../utils/token";

function PrincipalTeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const auth = getAuth();
      const response = await fetch("/api/principal/admins", {
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch teachers");
      const data = await response.json();
      setTeachers(data.content || []);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      const auth = getAuth();
      const response = await fetch("/api/principal/admins", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create teacher");
      const newTeacher = await response.json();
      setTeachers([...teachers, newTeacher]);
      setFormData({ username: "", email: "", fullName: "", password: "" });
      setShowForm(false);
      alert("Teacher created successfully!");
    } catch (err) {
      alert("Error creating teacher: " + err.message);
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;

    try {
      const auth = getAuth();
      const response = await fetch(`/api/principal/admins/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete teacher");
      setTeachers(teachers.filter((t) => t.id !== id));
      alert("Teacher deleted successfully!");
    } catch (err) {
      alert("Error deleting teacher: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Manage Teachers</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/10 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Manage Teachers</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-gradient-to-r from-sky-400 to-blue-600 text-white rounded-lg hover:scale-105 transition"
        >
          {showForm ? "Cancel" : "+ Add Teacher"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={handleCreateTeacher}
          className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
              required
            />
            <input
              type="text"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-600 text-white rounded-lg hover:scale-105 transition font-semibold"
          >
            Create Teacher
          </button>
        </form>
      )}

      {/* Teachers List */}
      <div className="space-y-4">
        {teachers.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center text-gray-400">
            No teachers found
          </div>
        ) : (
          teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4 flex justify-between items-center hover:bg-white/10 transition"
            >
              <div>
                <h3 className="text-white font-semibold">{teacher.fullName}</h3>
                <p className="text-gray-400 text-sm">
                  @{teacher.username} • {teacher.email}
                </p>
              </div>
              <button
                onClick={() => handleDeleteTeacher(teacher.id)}
                className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PrincipalTeachersPage;
