const apiBaseURL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';

export const buildWebSocketURL = (path: string) => {
  const url = new URL(path, apiBaseURL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
};
