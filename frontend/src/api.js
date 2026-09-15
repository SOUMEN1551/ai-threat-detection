// Centralized API configuration
// In development, VITE_API_URL falls back to localhost:8000
// In production (Vercel), VITE_API_URL will point to your Render backend URL
const rawUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const API_URL = rawUrl.replace(/\/+$/, '');
export default API_URL;
