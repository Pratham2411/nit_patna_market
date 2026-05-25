const API_ROOT = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');

export function mediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
}
