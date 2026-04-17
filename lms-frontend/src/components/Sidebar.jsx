import { NavLink } from "react-router-dom";

function Sidebar({ role }) {
  const adminMenu = [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/attendance", label: "Mark Attendance" },
    { to: "/admin/students", label: "Students" },
    { to: "/admin/courses", label: "Courses" },
    { to: "/profile", label: "Profile" },
  ];

  const studentMenu = [
    { to: "/student/dashboard", label: "Dashboard" },
    { to: "/student/courses", label: "Courses" },
    { to: "/student/tasks", label: "Tasks" },
    { to: "/student/attendance", label: "Attendance" },
    { to: "/student/notifications", label: "Notifications" },
    { to: "/profile", label: "Profile" },
  ];

  const items = role === "ADMIN" ? adminMenu : studentMenu;

  return (
    <aside className="glass m-4 w-64 rounded-2xl p-4">
      <h2 className="mb-6 text-xl font-bold">LMS Portal</h2>
      <nav className="space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-xl px-3 py-2 text-sm transition ${
                isActive ? "bg-sky-500/40 text-white" : "hover:bg-white/10"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;

