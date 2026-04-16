import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export const api = axios.create({
  baseURL,
  timeout: 10_000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (import.meta.env.DEV) {
      console.error('[API]', err?.response?.status, err?.config?.url, err?.message);
    }
    return Promise.reject(err);
  },
);
