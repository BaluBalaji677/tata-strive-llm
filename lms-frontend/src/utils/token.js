const ACCESS_TOKEN_KEY = "lms_access_token";
const REFRESH_TOKEN_KEY = "lms_refresh_token";
const ROLE_KEY = "lms_role";
const USERNAME_KEY = "lms_username";

let inMemoryAccessToken = null;

export const setAuth = ({ accessToken, refreshToken, role, username }) => {
  inMemoryAccessToken = accessToken;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USERNAME_KEY, username);
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

export const clearAuth = () => {
  inMemoryAccessToken = null;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USERNAME_KEY);
};

export const getAuth = () => {
  const token = getAccessToken();

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};