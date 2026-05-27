import axios from 'axios';

function getApiBase() {
  const env = import.meta.env.VITE_API_URL?.trim();
  if (!env) return '/api';
  const base = env.replace(/\/$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

const api = axios.create({
  baseURL: getApiBase(),
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token; let the browser set multipart boundaries for FormData
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

export default api;
