import api from "./axios";

export const uploadCourseCertificate = async (courseId, certificateName, file) => {
  const formData = new FormData();
  formData.append("certificateName", certificateName);
  formData.append("file", file);

  const response = await api.post(
    `/api/admin/courses/${courseId}/certificate/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const getCourseCertificate = async (courseId) => {
  const response = await api.get(`/api/courses/${courseId}/certificate`);
  return response.data;
};
