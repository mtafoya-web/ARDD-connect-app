/**
 * Sessions service.
 *
 * Sessions are events whose `ardd_meta.sessionType` is set; the backend
 * keeps them in the same `Event` table but exposes them under /sessions
 * so the UI doesn't have to filter client-side. Starred sessions live
 * in User.ardd_meta.sessionsOfInterest (list[int]).
 */
import client from '../api/client';
import { API_ROUTES } from '../constants/apiRoutes';
import { requireNumericId } from '../lib/ids';
import { normalizeSessions, normalizeStarResponse } from '../lib/normalize';
import type { SessionDTO, StarSessionResponse } from '../types';

export async function listSessions(): Promise<SessionDTO[]> {
  const res = await client.get(API_ROUTES.sessions.list);
  return normalizeSessions(res.data);
}

export async function getRecommendedSessions(limit = 20): Promise<SessionDTO[]> {
  const res = await client.get(API_ROUTES.sessions.recommended, { params: { limit } });
  return normalizeSessions(res.data);
}

export async function getMySessions(): Promise<SessionDTO[]> {
  const res = await client.get(API_ROUTES.sessions.my);
  return normalizeSessions(res.data);
}

/**
 * Toggle a session in the caller's `sessionsOfInterest`. `sessionId` must
 * be a positive integer — the backend route is /sessions/{session_id}/star
 * and a non-numeric param will 422.
 */
export async function starSession(
  sessionId: unknown,
  star: boolean,
): Promise<StarSessionResponse> {
  const id = requireNumericId(sessionId);
  const res = await client.post(API_ROUTES.sessions.star(id), { star });
  return normalizeStarResponse(res.data);
}
