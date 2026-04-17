import { getAccessToken, getRole } from "./token";

export const isAuthenticated = () => Boolean(getAccessToken());

export const isAllowedRole = (allowed) => {
  const role = getRole();
  return allowed.includes(role);
};

