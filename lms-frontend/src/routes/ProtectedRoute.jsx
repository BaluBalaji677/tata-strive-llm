import { Navigate, Outlet } from "react-router-dom";
import { isAllowedRole, isAuthenticated } from "../utils/auth";

function ProtectedRoute({ allowedRoles }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!isAllowedRole(allowedRoles)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;

