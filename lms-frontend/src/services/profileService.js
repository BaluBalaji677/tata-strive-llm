import api from "../api/axios";
import { API_ENDPOINTS } from "../api/endpoints";
import { getAccessToken, getRole } from "../utils/token";

const buildProfileEndpoint = () => {
  const role = getRole();
  let endpoint = API_ENDPOINTS.PROFILE.BASE;

  if (role === "ADMIN") {
    endpoint = API_ENDPOINTS.PROFILE.ADMIN_BASE;
  } else if (role === "STUDENT") {
    endpoint = API_ENDPOINTS.PROFILE.STUDENT_BASE;
  } else if (role === "PRINCIPAL") {
    endpoint = API_ENDPOINTS.PROFILE.PRINCIPAL_BASE;
  }

  console.debug(
    `[ProfileService] role=${role} tokenExists=${!!getAccessToken()} endpoint=${endpoint}`
  );
  return endpoint;
};

const logAndThrow = (context, error) => {
  console.error(
    `[ProfileService] ${context} failed endpoint=${error.config?.url} status=${error.response?.status || "N/A"} message=${error.message}`,
    error
  );
  throw error;
};

export const getProfile = async () => {
  const endpoint = buildProfileEndpoint();
  try {
    const response = await api.get(endpoint);
    console.debug(`[ProfileService] GET ${endpoint} status=${response.status}`);
    return response.data;
  } catch (error) {
    logAndThrow("getProfile", error);
  }
};

export const updateProfile = async (profileData) => {
  const endpoint = buildProfileEndpoint();
  try {
    const response = await api.put(endpoint, profileData);
    console.debug(`[ProfileService] PUT ${endpoint} status=${response.status}`);
    return response.data;
  } catch (error) {
    logAndThrow("updateProfile", error);
  }
};

export const uploadProfileImage = async (file) => {
  const endpoint = `${buildProfileEndpoint()}${API_ENDPOINTS.PROFILE.UPLOAD_IMAGE}`;
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.debug(`[ProfileService] POST ${endpoint} status=${response.status}`);
    return response.data;
  } catch (error) {
    logAndThrow("uploadProfileImage", error);
  }
};
