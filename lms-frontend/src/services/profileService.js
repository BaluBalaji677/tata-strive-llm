import api from "../api/axios";
import { API_ENDPOINTS } from "../api/endpoints";

export const getProfile = async () => {
  const response = await api.get(API_ENDPOINTS.PROFILE.BASE);
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put(API_ENDPOINTS.PROFILE.BASE, profileData);
  return response.data;
};

export const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(API_ENDPOINTS.PROFILE.UPLOAD_IMAGE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
