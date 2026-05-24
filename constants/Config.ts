const apiBase = process.env.EXPO_PUBLIC_API_BASE;

if (!apiBase) {
  console.warn('Missing EXPO_PUBLIC_API_BASE. Check your .env file.');
}

export const API_BASE_URL = (apiBase ?? '').replace(/\/$/, '');