/**
 * Response normalization helpers.
 *
 * Backend payloads are mostly well-formed today, but screens have been
 * crashing in the past when an unexpected shape (null, error envelope,
 * missing key) flowed into a raw `.map`. These helpers give every
 * service a single place to coerce "looks roughly right" into "safe to
 * render", so screens never need to defend themselves.
 *
 * Rules:
 *  - Always return the safe-empty value on bad input (never throw).
 *  - Never silently fabricate fields the UI relies on; if a required
 *    field is missing, return null and let the screen show empty state.
 */
import type {
  ARDDMatchCard,
  ARDDMatchesResponse,
  ARDDMatchCompareResponse,
  ARDDMatchPublicProfile,
  AuthResponse,
  BotAttachment,
  BotIntent,
  BotReply,
  BotSessionRef,
  Conversation,
  MediaUploadResult,
  Message,
  PasswordResetConfirmResponse,
  PasswordResetRequestResponse,
  SessionDTO,
  StarSessionResponse,
  User,
  UserPhotoResponse,
} from '../types';

export const normalizeArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

const normalizeMatchProfile = (value: any): ARDDMatchPublicProfile | null => {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.id !== 'number') return null;
  return {
    id: value.id,
    username: value.username ?? '',
    full_name: value.full_name ?? '',
    affiliation: value.affiliation ?? '',
    bio: value.bio ?? '',
    profile_photo_url: value.profile_photo_url ?? '',
    role: value.role,
    orgType: value.orgType,
    companyStage: value.companyStage,
    researchFocus: normalizeArray<string>(value.researchFocus),
    businessGoals: normalizeArray<string>(value.businessGoals),
    availability: normalizeArray<string>(value.availability),
    introTagline: value.introTagline,
  };
};

const normalizeMatchCard = (value: any): ARDDMatchCard | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = normalizeMatchProfile(value.candidate);
  if (!candidate) return null;
  return {
    matchId: String(value.matchId ?? `${value.userId}:${value.candidateId}`),
    userId: Number(value.userId),
    candidateId: Number(value.candidateId),
    candidate,
    score: Number(value.score) || 0,
    scenario: String(value.scenario ?? 'general_networking'),
    reasons: {
      bullets: normalizeArray<string>(value.reasons?.bullets),
      sharedFocus: normalizeArray<string>(value.reasons?.sharedFocus),
      complementaryGoals: normalizeArray<{ a: string; b: string }>(
        value.reasons?.complementaryGoals,
      ),
      conversationStarter: value.reasons?.conversationStarter ?? '',
      source: value.reasons?.source ?? 'deterministic',
    },
  };
};

/**
 * /matches/me returns `{ me, matches }`. We map over `data.matches` (not
 * `data` itself) because the backend wraps the list in an envelope to
 * include the caller's profile alongside the cards.
 */
export const normalizeMatchesResponse = (data: unknown): ARDDMatchesResponse => {
  const obj = (data ?? {}) as any;
  const me = normalizeMatchProfile(obj.me);
  const matches = normalizeArray<any>(obj.matches)
    .map(normalizeMatchCard)
    .filter((c): c is ARDDMatchCard => c !== null);
  return {
    me: me ?? ({
      id: 0,
      username: '',
      full_name: '',
      affiliation: '',
      bio: '',
    } as ARDDMatchPublicProfile),
    matches,
  };
};

export const normalizeMatchCompareResponse = (
  data: unknown,
): ARDDMatchCompareResponse | null => {
  const obj = (data ?? {}) as any;
  const me = normalizeMatchProfile(obj.me);
  const them = normalizeMatchProfile(obj.them);
  if (!me || !them) return null;
  return {
    me,
    them,
    score: Number(obj.score) || 0,
    scenario: String(obj.scenario ?? 'general_networking'),
    reasons: {
      bullets: normalizeArray<string>(obj.reasons?.bullets),
      sharedFocus: normalizeArray<string>(obj.reasons?.sharedFocus),
      complementaryGoals: normalizeArray<{ a: string; b: string }>(
        obj.reasons?.complementaryGoals,
      ),
      conversationStarter: obj.reasons?.conversationStarter ?? '',
      source: obj.reasons?.source ?? 'deterministic',
    },
  };
};

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const normalizeConversations = (data: unknown): Conversation[] =>
  normalizeArray<any>(data)
    .filter((c) => c && typeof c === 'object' && c.user && typeof c.user.id === 'number')
    .map((c) => ({
      user: c.user,
      last_message: c.last_message ?? '',
      last_message_at: c.last_message_at ?? '',
    }));

export const normalizeMessages = (data: unknown): Message[] =>
  normalizeArray<any>(data)
    .filter(
      (m) =>
        m &&
        typeof m === 'object' &&
        typeof m.id === 'number' &&
        typeof m.sender_id === 'number' &&
        typeof m.receiver_id === 'number',
    )
    .map((m) => ({
      id: m.id,
      sender_id: m.sender_id,
      receiver_id: m.receiver_id,
      content: String(m.content ?? ''),
      created_at: m.created_at ?? '',
    }));

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

const normalizeSession = (value: any): SessionDTO | null => {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.id !== 'number') return null;
  return {
    id: value.id,
    title: String(value.title ?? ''),
    description: String(value.description ?? ''),
    location: String(value.location ?? ''),
    start_date: String(value.start_date ?? ''),
    end_date: String(value.end_date ?? ''),
    sessionType: value.sessionType,
    topicTags: normalizeArray<string>(value.topicTags),
    speakers: normalizeArray<{ name: string; affiliation?: string }>(value.speakers),
    room: value.room,
    track: value.track,
    score: typeof value.score === 'number' ? value.score : value.score == null ? null : Number(value.score),
    reasons: Array.isArray(value.reasons) ? value.reasons.map(String) : null,
    starred: Boolean(value.starred),
  };
};

export const normalizeSessions = (data: unknown): SessionDTO[] =>
  normalizeArray<any>(data)
    .map(normalizeSession)
    .filter((s): s is SessionDTO => s !== null);

export const normalizeStarResponse = (data: unknown): StarSessionResponse => {
  const obj = (data ?? {}) as any;
  return {
    starred: Boolean(obj.starred),
    sessionsOfInterest: normalizeArray<unknown>(obj.sessionsOfInterest)
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n)),
  };
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * The `User` shape is wide and the backend always returns it complete,
 * but `ardd_meta` can come back as `null` for legacy rows. We coerce to
 * `undefined` so optional-property checks (`user.ardd_meta?.role`) work
 * uniformly across the app.
 */
export const normalizeUser = (value: any): User | null => {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.id !== 'number' || typeof value.username !== 'string') return null;
  return {
    ...value,
    ardd_meta: value.ardd_meta ?? undefined,
  } as User;
};

export const normalizeUsers = (data: unknown): User[] =>
  normalizeArray<any>(data)
    .map(normalizeUser)
    .filter((u): u is User => u !== null);

export const normalizePhotoResponse = (data: unknown): UserPhotoResponse => {
  const obj = (data ?? {}) as any;
  return {
    profile_photo_url: String(obj.profile_photo_url ?? ''),
    profile_photo_public_id:
      typeof obj.profile_photo_public_id === 'string'
        ? obj.profile_photo_public_id
        : undefined,
  };
};

export const normalizeAuthResponse = (data: unknown): AuthResponse | null => {
  const obj = (data ?? {}) as any;
  if (typeof obj.access_token !== 'string' || !obj.access_token) return null;
  const user = normalizeUser(obj.user);
  if (!user) return null;
  return {
    access_token: obj.access_token,
    token_type: String(obj.token_type ?? 'bearer'),
    user,
  };
};

export const normalizeCurrentUser = (data: unknown): User | null => normalizeUser(data);

export const normalizePasswordResetRequest = (
  data: unknown,
): PasswordResetRequestResponse => {
  const obj = (data ?? {}) as any;
  return {
    message: String(obj.message ?? ''),
    reset_token: typeof obj.reset_token === 'string' ? obj.reset_token : undefined,
  };
};

export const normalizePasswordResetConfirm = (
  data: unknown,
): PasswordResetConfirmResponse => {
  const obj = (data ?? {}) as any;
  return { message: String(obj.message ?? '') };
};

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

/**
 * /media/upload returns a Cloudinary-or-local envelope. The URL and
 * public_id are required by every caller; the others are best-effort.
 * Returns null if the upload response is missing a usable URL so
 * callers don't push a broken MediaItem into post content.
 */
export const normalizeMediaUploadResult = (
  data: unknown,
): MediaUploadResult | null => {
  const obj = (data ?? {}) as any;
  if (typeof obj.url !== 'string' || !obj.url) return null;
  return {
    url: obj.url,
    public_id: String(obj.public_id ?? ''),
    format: String(obj.format ?? ''),
    resource_type: String(obj.resource_type ?? 'image'),
  };
};

// ---------------------------------------------------------------------------
// Bot
// ---------------------------------------------------------------------------

const normalizeBotSessionRef = (value: any): BotSessionRef | null => {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.id !== 'number') return null;
  return {
    id: value.id,
    title: String(value.title ?? ''),
    start_date: value.start_date,
    end_date: value.end_date,
    location: value.location,
    room: value.room,
    sessionType: value.sessionType,
  };
};

/**
 * Bot attachments come in several shapes (session/match/post). The UI
 * only renders `session` today, but we keep the rest so future
 * renderers can opt in without a backend or normalizer change.
 */
export const normalizeBotAttachments = (data: unknown): BotAttachment[] =>
  normalizeArray<any>(data)
    .filter((a) => a && typeof a === 'object' && typeof a.type === 'string')
    .map((a): BotAttachment => {
      if (a.type === 'session') {
        const session = normalizeBotSessionRef(a.session);
        return { type: 'session', session: session ?? undefined };
      }
      if (a.type === 'post') {
        return {
          type: 'post',
          post_id: Number(a.post_id) || undefined,
          sentiment: a.sentiment,
          takeaway: a.takeaway,
        };
      }
      if (a.type === 'match') {
        return { type: 'match', match: a.match };
      }
      return { type: String(a.type) };
    });

export const normalizeBotReply = (data: unknown): BotReply => {
  const obj = (data ?? {}) as any;
  return {
    intent: String(obj.intent ?? 'help'),
    response: String(obj.response ?? ''),
    attachments: normalizeBotAttachments(obj.attachments),
  };
};

export const normalizeBotIntents = (data: unknown): BotIntent[] =>
  normalizeArray<any>(data)
    .filter(
      (i) =>
        i &&
        typeof i === 'object' &&
        typeof i.intent === 'string' &&
        typeof i.label === 'string',
    )
    .map((i) => ({
      intent: String(i.intent),
      label: String(i.label),
      sample: String(i.sample ?? ''),
    }));
