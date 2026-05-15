import axios from 'axios';
import {API_BASE_URL} from '../config/env';
import {tokenStorage} from '../services/tokenStorage';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: true,
});

const cookieHeader = tokens => {
  if (!tokens?.accessToken || !tokens?.refreshToken) {
    return undefined;
  }
  return `accessToken=${tokens.accessToken}; refreshToken=${tokens.refreshToken}`;
};

client.interceptors.request.use(async config => {
  const tokens = await tokenStorage.load();
  const cookie = cookieHeader(tokens);
  if (cookie) {
    config.headers.Cookie = cookie;
  }
  return config;
});

client.interceptors.response.use(
  response => response.data,
  async error => {
    const status = error.response?.status;
    const originalRequest = error.config;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const tokens = await tokenStorage.load();
        const refreshResponse = await axios.get(`${API_BASE_URL}/auth/refresh`, {
          headers: {Cookie: cookieHeader(tokens)},
          timeout: 20000,
        });
        if (refreshResponse.data?.tokens) {
          await tokenStorage.save(refreshResponse.data.tokens);
        }
        return client(originalRequest);
      } catch (refreshError) {
        await tokenStorage.clear();
        return Promise.reject(refreshError);
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  },
);

export default client;
