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

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
