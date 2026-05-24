/**
 * Matches service.
 *
 * Reference implementation for the service-layer pattern: screens call
 * named functions here, never axios directly. The service owns URL
 * construction (via API_ROUTES), ID validation, and response shaping.
 */
import client from '../api/client';
import { API_ROUTES } from '../constants/apiRoutes';
import { requireNumericId } from '../lib/ids';
import {
  normalizeMatchCompareResponse,
  normalizeMatchesResponse,
} from '../lib/normalize';
import type { ARDDMatchCompareResponse, ARDDMatchesResponse } from '../types';

/**
 * GET /matches/me — returns the caller's profile plus a ranked list of
 * deterministic match cards. The backend recomputes scores on every
 * call (no Match table), so callers should not cache aggressively.
 */
export async function getMyMatches(limit?: number): Promise<ARDDMatchesResponse> {
  const res = await client.get(API_ROUTES.matches.me, {
    params: limit ? { limit } : undefined,
  });
  return normalizeMatchesResponse(res.data);
}

/**
 * GET /matches/compare/{candidate_id} — side-by-side view for a single
 * candidate. Throws InvalidIdError if `candidateId` isn't a positive
 * integer, since this is always a bug at the call site (route param
 * came through unparsed).
 */
export async function compareMatch(
  candidateId: unknown,
): Promise<ARDDMatchCompareResponse | null> {
  const id = requireNumericId(candidateId);
  const res = await client.get(API_ROUTES.matches.compare(id));
  return normalizeMatchCompareResponse(res.data);
}
