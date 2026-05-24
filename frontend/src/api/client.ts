import axios from 'axios';

/**
 * Resolve the API base URL at module load.
 *
 * Vite inlines VITE_API_BASE_URL at build time. If the variable is
 * missing from the deploy host (e.g. Vercel project settings), the
 * built bundle would otherwise silently fall back to localhost — which
 * the browser then blocks as mixed content from an https page, leaving
 * the network tab eerily empty.
 *
 * Behavior:
 *  - Local dev (vite/Vite dev server): falls back to http://localhost:8000.
 *  - Production build: throws at load. The app white-screens with a
 *    clear console error instead of pretending to work.
 */
const envBaseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;

let baseURL: string;
if (envBaseURL) {
  baseURL = envBaseURL;
} else if (import.meta.env.DEV) {
  baseURL = 'http://localhost:8000';
} else {
  throw new Error(
    'VITE_API_BASE_URL is not set. The deploy host needs this env var ' +
      '(e.g. https://ardd-connect-app.onrender.com). Configure it in your ' +
      'hosting provider\'s environment variables and redeploy.',
  );
}

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

  // Temporary debug log. You can remove this after confirming auth works.
  console.log('[API CLIENT]', config.method?.toUpperCase(), config.url, {
    hasToken: Boolean(token),
    baseURL: config.baseURL,
  });

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

    const isOptionalAuthEndpoint =
      url.includes('/sessions/my') ||
      url.includes('/sessions/recommended') ||
      (url.includes('/sessions/') && url.includes('/star'));

    if (status === 401 && !isAuthAttempt && !isOptionalAuthEndpoint) {
      clearStoredAuth();
      window.dispatchEvent(new Event('ardd-auth-cleared'));
    }

    return Promise.reject(error);
  },
);

export default client;