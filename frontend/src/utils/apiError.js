export function getApiErrorMessage(err, fallback) {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.status === 404) {
    return 'API not found. Set VITE_API_URL on Vercel to your Render URL and redeploy.';
  }
  if (err.code === 'ERR_NETWORK' || !err.response) {
    return 'Cannot reach server. Check VITE_API_URL, CORS, or wait for Render to wake up.';
  }
  return fallback;
}
