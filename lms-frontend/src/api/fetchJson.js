import { buildApiUrl } from "./config";
import { getAccessToken } from "../utils/token";

export const fetchJson = async (path, options = {}) => {
  const token = getAccessToken();
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.debug(
    `[fetchJson] tokenExists=${!!token} endpoint=${path} method=${options.method || "GET"}`
  );

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `Expected JSON but received ${contentType || "unknown content type"}`
    );
  }

  return response.json();
};
