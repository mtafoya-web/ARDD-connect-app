/**
 * Auth service.
 *
 * Wraps the auth endpoints and the "who am I" lookup. The login call is
 * the most idiosyncratic one and the reason this service exists:
 *
 *   POST /auth/login uses FastAPI's OAuth2PasswordRequestForm, which
 *   requires Content-Type: application/x-www-form-urlencoded with
 *   `username` and `password` as form fields — NOT JSON. Every screen
 *   sending login as JSON gets a confusing 422. We do the encoding once
 *   here so the rest of the app can call `login({username, password})`.
 *
 * `getCurrentUser()` hits /users/me. It lives in auth (not users)
 * because it's the canonical "is this token still valid?" probe used
 * during bootstrap and after token refresh.
 */
import client from '../api/client';
import { API_ROUTES } from '../constants/apiRoutes';
import {
  normalizeAuthResponse,
  normalizeCurrentUser,
  normalizePasswordResetConfirm,
  normalizePasswordResetRequest,
} from '../lib/normalize';
import type {
  AuthResponse,
  LoginPayload,
  PasswordResetConfirmResponse,
  PasswordResetRequestResponse,
  RegisterPayload,
  User,
} from '../types';

export class AuthResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthResponseError';
  }
}

export async function register(payload: RegisterPayload): Promise<void> {
  await client.post(API_ROUTES.auth.register, payload);
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  // FastAPI OAuth2PasswordRequestForm expects form-urlencoded fields,
  // not JSON. Build it explicitly so axios doesn't infer JSON from a
  // plain object and send the wrong Content-Type.
  const form = new URLSearchParams();
  form.append('username', payload.username);
  form.append('password', payload.password);

  const res = await client.post(API_ROUTES.auth.login, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const normalized = normalizeAuthResponse(res.data);
  if (!normalized) throw new AuthResponseError('Login response missing token or user');
  return normalized;
}

export async function googleLogin(credential: string): Promise<AuthResponse> {
  const res = await client.post(API_ROUTES.auth.google, { credential });
  const normalized = normalizeAuthResponse(res.data);
  if (!normalized) throw new AuthResponseError('Google login response missing token or user');
  return normalized;
}

/**
 * GET /users/me. Returns null if the response is missing required
 * identity fields, which AuthContext treats as "invalid token, sign out".
 */
export async function getCurrentUser(): Promise<User | null> {
  const res = await client.get(API_ROUTES.users.me);
  return normalizeCurrentUser(res.data);
}

export async function requestPasswordReset(
  identifier: string,
): Promise<PasswordResetRequestResponse> {
  const res = await client.post(API_ROUTES.auth.passwordResetRequest, { identifier });
  return normalizePasswordResetRequest(res.data);
}

export async function confirmPasswordReset(
  token: string,
  password: string,
): Promise<PasswordResetConfirmResponse> {
  const res = await client.post(API_ROUTES.auth.passwordResetConfirm, { token, password });
  return normalizePasswordResetConfirm(res.data);
}
