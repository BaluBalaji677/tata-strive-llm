import { Navigate, Outlet } from "react-router-dom";
import { isAllowedRole, isAuthenticated } from "../utils/auth";
import { getUsername, getRole, getAccessToken, getMustChangePassword } from "../utils/token";

function ProtectedRoute({ allowedRoles }) {
  const isAuth = isAuthenticated();
  const allowed = isAllowedRole(allowedRoles);
  const path = window.location.pathname;
  const username = getUsername();
  const role = getRole();
  const hasToken = Boolean(getAccessToken());
  const mustChange = getMustChangePassword();

  console.log(`[Route Guard] URL: "${path}", Authenticated: ${isAuth}, User: "${username}", Role: "${role}", TokenExists: ${hasToken}, AllowedRoles: ${JSON.stringify(allowedRoles)}, MustChange: ${mustChange}`);

  if (!isAuth) {
    console.warn(`[Route Guard] Access Denied to "${path}" - Not authenticated. Redirecting to login.`);
    return <Navigate to="/login" replace />;
  }

  if (!allowed) {
    console.warn(`[Route Guard] Access Denied to "${path}" - Role "${role}" not allowed. Redirecting to login.`);
    return <Navigate to="/login" replace />;
  }

  if (mustChange && path !== "/change-password" && path !== "/admin/change-password") {
    console.warn(`[Route Guard] Access Blocked to "${path}" - Password change required.`);
    if (role === "STUDENT") {
      return <Navigate to="/change-password" replace />;
    } else if (role === "ADMIN" || role === "TEACHER") {
      return <Navigate to="/admin/change-password" replace />;
    }
  }

  console.log(`[Route Guard] Access Granted to "${path}"`);
  return <Outlet />;
}

export default ProtectedRoute;

