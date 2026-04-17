import { useEffect, useState } from "react";
import { getStudentTasks } from "../../api/taskApi";

const normalizeTask = (task) => {
  const rawStatus = String(task?.status ?? "").toLowerCase();
  const isCompleted = rawStatus === "completed" || rawStatus === "done";

  return {
    id: task?.id ?? task?.taskId ?? `${task?.title ?? "task"}-${task?.dueDate ?? ""}`,
    title: task?.title ?? task?.name ?? "Untitled Task",
    dueDate: task?.dueDate ?? task?.deadline ?? null,
    status: isCompleted ? "Completed" : "Pending",
  };
};

function StudentTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentTasks()
      .then((data) => {
        const list = Array.isArray(data) ? data.map(normalizeTask) : [];
        setTasks(list);
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = (taskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "Completed",
            }
          : task
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-sm text-slate-300">Track your pending and completed tasks.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-300">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-slate-300">No tasks available.</p>
        </div>
      ) : (
        <div className="glass overflow-x-auto rounded-2xl p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-300">
                <th className="pb-3 pr-4 font-medium">Task Title</th>
                <th className="pb-3 pr-4 font-medium">Due Date</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const completed = task.status === "Completed";
                return (
                  <tr key={task.id} className="border-t border-white/10">
                    <td className="py-3 pr-4">{task.title}</td>
                    <td className="py-3 pr-4">{task.dueDate ?? "N/A"}</td>
                    <td className="py-3 pr-4">{task.status}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        disabled={completed}
                        onClick={() => handleSubmit(task.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          completed
                            ? "cursor-not-allowed bg-slate-600/50 text-slate-300"
                            : "bg-sky-500/80 text-white hover:bg-sky-500"
                        }`}
                      >
                        Submit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StudentTasksPage;

