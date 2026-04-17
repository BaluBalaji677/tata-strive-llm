import api from "../api/axios";

export const getProfile = async () => {
  const response = await api.get('/api/profile');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put('/api/profile', profileData);
  return response.data;
};

export const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/profile/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
