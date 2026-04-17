import { useEffect, useState } from "react";

const initialFormState = {
  fullName: "",
  username: "",
  rollNumber: "",
  status: "ACTIVE",
};

function StudentForm({ onSubmit, initialData = null }) {
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (initialData) {
      setForm({
        fullName: initialData?.fullName ?? "",
        username: initialData?.username ?? "",
        rollNumber: initialData?.rollNumber ?? "",
        status: initialData?.status ?? "ACTIVE",
      });
    } else {
      setForm(initialFormState);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.username.trim() || !form.rollNumber.trim()) return;
    onSubmit?.({
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      rollNumber: form.rollNumber.trim(),
      status: form.status,
    });
    if (!initialData) {
      setForm(initialFormState);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-xl"
    >
      <div>
        <label className="mb-1 block text-sm text-slate-200">Student Name</label>
        <input
          type="text"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          placeholder="Enter full name"
          className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-200">Username / Email</label>
        <input
          type="text"
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="student@example.com"
          className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-200">Roll Number</label>
        <input
          type="text"
          name="rollNumber"
          value={form.rollNumber}
          onChange={handleChange}
          placeholder="ROLL-001"
          className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-200">Status</label>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="WARNING">WARNING</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      <button
        type="submit"
        className="rounded-lg bg-indigo-500/80 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-indigo-500"
      >
        {initialData ? "Update Student" : "Add Student"}
      </button>
    </form>
  );
}

export default StudentForm;
