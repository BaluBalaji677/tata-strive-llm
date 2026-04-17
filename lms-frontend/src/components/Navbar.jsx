import { useNavigate } from "react-router-dom";
import { clearAuth, getRole } from "../utils/token";

function Navbar() {
  const navigate = useNavigate();
  const role = getRole();

  const onLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <header className="glass m-4 flex items-center justify-between rounded-2xl px-4 py-3">
      <div>
        <p className="text-xs text-slate-300">Logged in as</p>
        <p className="font-semibold">{role}</p>
      </div>
      <button
        onClick={onLogout}
        className="rounded-lg bg-rose-500/80 px-4 py-2 text-sm font-medium hover:bg-rose-500"
      >
        Logout
      </button>
    </header>
  );
}

export default Navbar;

