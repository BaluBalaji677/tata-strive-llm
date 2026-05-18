import api from "./axios";
import { getAccessToken } from "../utils/token";
import { API_ENDPOINTS } from "./endpoints";

const safeJsonResponse = async (response) => {
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Non-JSON response from server:", text);
      const error = new Error("Server returned invalid response");
      error.status = response.status;
      error.body = text;
      throw error;
    }
  }

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || response.statusText || "Request failed");
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
};

const fetchWithAuth = async (url, options = {}) => {
  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  return safeJsonResponse(response);
};

export const markAttendance = async ({ rollNumber, present }) => {
  const { data } = await api.post(API_ENDPOINTS.ATTENDANCE.ADMIN, null, {
    params: { rollNumber, present },
  });
  return data;
};

export const getStudentAttendance = async () => {
  const { data } = await api.get(API_ENDPOINTS.ATTENDANCE.STUDENT);
  return data;
};

export const getStudentAttendanceSummary = async () => {
  const { data } = await api.get(API_ENDPOINTS.ATTENDANCE.STUDENT_SUMMARY);
  return data;
};

export const registerFace = async ({ rollNumber, descriptor }) => {
  return fetchWithAuth(`http://localhost:8080${API_ENDPOINTS.ATTENDANCE.FACE_REGISTER}`, {
    method: "POST",
    body: JSON.stringify({ rollNumber, descriptor }),
  });
};

export const recognizeFace = async ({ rollNumber, descriptor }) => {
  return fetchWithAuth(`http://localhost:8080${API_ENDPOINTS.ATTENDANCE.FACE_RECOGNIZE}`, {
    method: "POST",
    body: JSON.stringify({ rollNumber, descriptor }),
  });
};

export const recognizeMultipleFaces = async ({ descriptors }) => {
  return fetchWithAuth(`http://localhost:8080${API_ENDPOINTS.ATTENDANCE.FACE_RECOGNIZE_MULTIPLE}`, {
    method: "POST",
    body: JSON.stringify({ descriptors }),
  });
};

