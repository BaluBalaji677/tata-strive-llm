import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { getRole } from "../utils/token";

function DashboardLayout() {
  const role = getRole();

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <div className="flex-1">
        <Navbar />
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

