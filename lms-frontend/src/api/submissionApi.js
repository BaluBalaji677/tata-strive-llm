import api from "./axios";

export const getMySubmissions = async () => {
  const { data } = await api.get("/student/submissions");
  return data;
};

