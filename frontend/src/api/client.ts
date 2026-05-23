import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';

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

export default client;
