import axios from "axios";
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from "../utils/token";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const onRefreshFailed = (error) => {
  refreshSubscribers.forEach((cb) => cb(null, error));
  refreshSubscribers = [];
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || !error?.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const isRefreshEndpoint = originalRequest.url?.includes("/auth/refresh");

    if (status === 401 && !isRefreshEndpoint) {
      if (originalRequest._retry) {
        clearAuth();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token, err) => {
            if (err || !token) {
              reject(err || error);
            } else {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            }
          });
        });
      }

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuth();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      isRefreshing = true;

      try {
        const { data } = await axios.post(
          "/auth/refresh",
          { refreshToken },
          { baseURL: "http://localhost:8080" }
        );

        const newAccessToken = data.accessToken;
        setAccessToken(newAccessToken);
        onRefreshed(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        onRefreshFailed(refreshError);
        clearAuth();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401 && isRefreshEndpoint) {
      clearAuth();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;

