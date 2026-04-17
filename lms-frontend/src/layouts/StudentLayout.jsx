import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function StudentLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar role="STUDENT" />
      <div className="flex-1">
        <Navbar />
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;

