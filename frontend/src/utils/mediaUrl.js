const API_ROOT = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');

export function mediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
  return `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
}
