const apiBase = process.env.EXPO_PUBLIC_API_BASE;

if (!apiBase) {
  console.warn(
    '[Config] EXPO_PUBLIC_API_BASE is undefined. ' +
    'Ensure your .env file contains EXPO_PUBLIC_API_BASE=<your-backend-url> ' +
    'and restart the bundler (env vars are baked in at build time).'
  );
}

export const API_BASE_URL = (apiBase ?? '').replace(/\/$/, '');

// Runtime sanity check — log if the resolved URL looks invalid
if (!API_BASE_URL || !API_BASE_URL.startsWith('http')) {
  console.error(
    `[Config] API_BASE_URL is invalid: "${API_BASE_URL}". ` +
    'Network requests will fail. Check EXPO_PUBLIC_API_BASE in your .env file.'
  );
}