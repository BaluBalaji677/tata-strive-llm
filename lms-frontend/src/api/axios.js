import axios from "axios";
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from "../utils/token";
import { API_BASE_URL } from "./config";

const api = axios.create({
  baseURL: API_BASE_URL,
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
  if (!config.headers) {
    config.headers = {};
  }
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.debug(
    `[axios] request ${config.method?.toUpperCase() || "GET"} ${config.url} tokenExists=${!!token}`
  );
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
        console.warn(`[axios] repeated 401 for ${originalRequest.url}, clearing auth`);
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
        console.warn(`[axios] 401 without refresh token for ${originalRequest.url}`);
        clearAuth();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      isRefreshing = true;

      try {
        const { data } = await axios.post(
          "/auth/refresh",
          { refreshToken },
          { baseURL: API_BASE_URL }
        );

        const newAccessToken = data.accessToken;
        setAccessToken(newAccessToken);
        onRefreshed(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        const refreshStatus = refreshError?.response?.status;
        onRefreshFailed(refreshError);
        if (refreshStatus === 401 || refreshStatus === 403) {
          clearAuth();
          window.location.href = "/login";
        } else {
          console.warn(
            `[axios] refresh endpoint error ${refreshStatus} for ${originalRequest.url}, preserving auth`
          );
        }
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
