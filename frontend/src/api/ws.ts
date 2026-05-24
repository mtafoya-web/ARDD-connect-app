// Mirror client.ts: dev gets a localhost fallback, prod must have the
// env var set explicitly so a missing Vercel/Render env doesn't silently
// route the WebSocket to ws://localhost:8000.
const envBaseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;

let apiBaseURL: string;
if (envBaseURL) {
  apiBaseURL = envBaseURL;
} else if (import.meta.env.DEV) {
  apiBaseURL = 'http://localhost:8000';
} else {
  throw new Error(
    'VITE_API_BASE_URL is not set. The WebSocket layer needs the same ' +
      'env var the REST client uses. Configure it on the deploy host and redeploy.',
  );
}

export const buildWebSocketURL = (path: string) => {
  const url = new URL(path, apiBaseURL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
};
