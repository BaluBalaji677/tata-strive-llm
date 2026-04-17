import api from "./axios";

export const getCourses = async () => {
  const { data } = await api.get("/courses");
  return data;
};

