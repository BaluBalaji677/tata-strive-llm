import { useEffect, useState } from "react";

const mockNotifications = [
  {
    id: 1,
    title: "Assignment Reminder",
    message: "Your Java assignment is due tomorrow.",
    date: "2026-04-09",
  },
  {
    id: 2,
    title: "New Course Material",
    message: "Week 4 notes for Data Structures have been uploaded.",
    date: "2026-04-08",
  },
  {
    id: 3,
    title: "Attendance Update",
    message: "Your attendance has been updated for this week.",
    date: "2026-04-07",
  },
];

function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-slate-300">Stay updated with the latest course alerts.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-300">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-slate-300">No notifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div key={item.id} className="glass rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">{item.title}</h2>
                <span className="text-xs text-slate-400">{item.date}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{item.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentNotificationsPage;

