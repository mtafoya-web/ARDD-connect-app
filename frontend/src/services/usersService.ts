/**
 * Users service.
 *
 * The "me" endpoints (GET/PUT /users/me, photo upload/delete) and the
 * by-id lookups all live here. The bootstrap-time `/users/me` probe
 * intentionally stays in authService — it's identity-validation, not
 * a profile fetch. Both call the same URL; the split is semantic.
 *
 * Posts/bookmarks returned from these endpoints are passed through as
 * `Post[]` without per-item normalization. When the `posts` area is
 * migrated, those will route through a normalizer instead.
 */
import client from '../api/client';
import { API_ROUTES } from '../constants/apiRoutes';
import { requireNumericId } from '../lib/ids';
import {
  normalizePhotoResponse,
  normalizeUser,
  normalizeUsers,
} from '../lib/normalize';
import type { Post, User, UserPhotoResponse } from '../types';

export async function getMe(): Promise<User | null> {
  const res = await client.get(API_ROUTES.users.me);
  return normalizeUser(res.data);
}

export async function updateMe(payload: Partial<User>): Promise<User | null> {
  const res = await client.put(API_ROUTES.users.me, payload);
  return normalizeUser(res.data);
}

/**
 * POST /users/me/photo accepts a multipart file in the `file` field and
 * returns `{profile_photo_url, profile_photo_public_id}`. Same Content-Type
 * note as mediaService: axios infers it from FormData; don't set it manually.
 */
export async function uploadMyPhoto(file: File): Promise<UserPhotoResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await client.post(API_ROUTES.users.mePhoto, form);
  return normalizePhotoResponse(res.data);
}

export async function removeMyPhoto(): Promise<void> {
  await client.delete(API_ROUTES.users.mePhoto);
}

export async function getUser(userId: unknown): Promise<User | null> {
  const id = requireNumericId(userId);
  const res = await client.get(API_ROUTES.users.byId(id));
  return normalizeUser(res.data);
}

export async function getUserPosts(userId: unknown): Promise<Post[]> {
  const id = requireNumericId(userId);
  const res = await client.get(API_ROUTES.users.posts(id));
  return Array.isArray(res.data) ? (res.data as Post[]) : [];
}

export async function getUserBookmarks(userId: unknown): Promise<Post[]> {
  const id = requireNumericId(userId);
  const res = await client.get(API_ROUTES.users.bookmarks(id));
  return Array.isArray(res.data) ? (res.data as Post[]) : [];
}

/**
 * GET /users/ — directory listing with optional search. The endpoint
 * accepts `q` as a query param. Previously some callers hit `/users`
 * (no trailing slash) which FastAPI 307-redirects; the route registry
 * uses `/users/` so this is now consistent.
 */
export async function listUsers(q?: string): Promise<User[]> {
  const res = await client.get(API_ROUTES.users.list, {
    params: q ? { q } : undefined,
  });
  return normalizeUsers(res.data);
}

export async function getSuggestions(): Promise<User[]> {
  const res = await client.get(API_ROUTES.users.suggestions);
  return normalizeUsers(res.data);
}
