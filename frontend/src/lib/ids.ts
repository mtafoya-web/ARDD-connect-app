/**
 * Path-param validation.
 *
 * Backend routes like /messages/{other_user_id}, /matches/compare/{candidate_id},
 * /sessions/{session_id}/star all require numeric IDs. If a screen pulls the
 * raw value from useParams() or a query string and passes "undefined" or
 * "NaN" straight into the URL, the server responds 422 and the screen looks
 * broken. Funnel every such call through `toNumericId` first.
 */
export function toNumericId(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Same as toNumericId but throws a typed error for callers that want to
 * fail loudly (e.g., service functions where a non-numeric ID is a bug,
 * not an empty-state). Screens should prefer the nullable variant.
 */
export class InvalidIdError extends Error {
  constructor(public readonly raw: unknown) {
    super(`Expected numeric id, got ${JSON.stringify(raw)}`);
    this.name = 'InvalidIdError';
  }
}

export function requireNumericId(value: unknown): number {
  const id = toNumericId(value);
  if (id === null) throw new InvalidIdError(value);
  return id;
}
