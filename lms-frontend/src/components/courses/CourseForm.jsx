import { useEffect, useState } from "react";

function CourseForm({ onSubmit, initialData = null }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData?.title ?? initialData?.name ?? "",
        description: initialData?.description ?? "",
        duration: initialData?.duration ?? "",
      });
    } else {
      setForm({ title: "", description: "", duration: "" });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit?.({
      title: form.title.trim(),
      description: form.description.trim(),
      duration: Number(form.duration || 0),
    });
    if (!initialData) {
      setForm({ title: "", description: "", duration: "" });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-xl"
    >
      <div>
        <label className="mb-1 block text-sm text-slate-200">Course Title</label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Enter course title"
          className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-200">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Enter course description"
          rows="3"
          className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none resize-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-200">Duration (days)</label>
        <input
          type="number"
          min="0"
          name="duration"
          value={form.duration}
          onChange={handleChange}
          placeholder="120"
          className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-indigo-500/80 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-indigo-500"
      >
        {initialData ? "Update Course" : "Add Course"}
      </button>
    </form>
  );
}

export default CourseForm;

