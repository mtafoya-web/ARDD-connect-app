import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';

export const clearStoredAuth = () => {
  localStorage.removeItem('ardd_token');
  localStorage.removeItem('ardd_user');
};

const client = axios.create({
  baseURL,
});

// Add Bearer token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('ardd_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthAttempt =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/google') ||
      url.includes('/auth/password-reset');

    if (status === 401 && !isAuthAttempt) {
      clearStoredAuth();
      window.dispatchEvent(new Event('ardd-auth-cleared'));
    }

    return Promise.reject(error);
  },
);

export default client;
