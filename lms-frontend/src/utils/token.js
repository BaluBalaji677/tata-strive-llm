const ACCESS_TOKEN_KEY = "lms_access_token";
const REFRESH_TOKEN_KEY = "lms_refresh_token";
const ROLE_KEY = "lms_role";
const USERNAME_KEY = "lms_username";

let inMemoryAccessToken = null;

export const setAuth = ({ accessToken, refreshToken, role, username, mustChangePassword }) => {
  inMemoryAccessToken = accessToken;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USERNAME_KEY, username);
  if (mustChangePassword !== undefined) {
    localStorage.setItem("lms_must_change_password", String(mustChangePassword));
  } else {
    localStorage.removeItem("lms_must_change_password");
  }
};

export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const getAccessToken = () => {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  inMemoryAccessToken = token;
  return token;
};

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const getRole = () => localStorage.getItem(ROLE_KEY);

export const getUsername = () => localStorage.getItem(USERNAME_KEY);

export const getAuth = () => ({
  accessToken: getAccessToken(),
  refreshToken: getRefreshToken(),
  role: getRole(),
  username: getUsername(),
});

export const clearAuth = () => {
  inMemoryAccessToken = null;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem("lms_must_change_password");
};

export const getMustChangePassword = () => {
  return localStorage.getItem("lms_must_change_password") === "true";
};

export const setMustChangePassword = (val) => {
  localStorage.setItem("lms_must_change_password", String(val));
};

