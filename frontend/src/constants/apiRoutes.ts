/**
 * Central registry of backend API routes.
 *
 * Goal: every fetch in the app resolves its URL here, so a backend
 * rename/move is a one-line change instead of a grep-and-pray across
 * 20+ screens. Keep this file purely declarative — no request logic,
 * no axios imports.
 *
 * Conventions:
 *  - Static paths are string literals.
 *  - Paths with params are functions that take typed args and return a string.
 *  - Trailing slash matches whatever the FastAPI router declares; do not
 *    "normalize" them here or you'll trigger 307 redirects.
 */
export const API_ROUTES = {
  auth: {
    // Login is form-urlencoded (OAuth2PasswordRequestForm on the backend),
    // NOT JSON. Service layer handles the encoding; this is just the URL.
    login: '/auth/login',
    register: '/auth/register',
    google: '/auth/google',
    passwordResetRequest: '/auth/password-reset/request',
    passwordResetConfirm: '/auth/password-reset/confirm',
  },
  users: {
    list: '/users/',
    me: '/users/me',
    mePhoto: '/users/me/photo',
    suggestions: '/users/suggestions',
    byId: (userId: number) => `/users/${userId}`,
    posts: (userId: number) => `/users/${userId}/posts`,
    bookmarks: (userId: number) => `/users/${userId}/bookmarks`,
  },
  posts: {
    root: '/posts/',
    home: '/posts/home',
    global: '/posts/global',
    admin: '/posts/admin',
    byId: (postId: number) => `/posts/${postId}`,
    like: (postId: number) => `/posts/${postId}/like`,
    bookmark: (postId: number) => `/posts/${postId}/bookmark`,
    repost: (postId: number) => `/posts/${postId}/repost`,
    replies: (postId: number) => `/posts/${postId}/replies`,
  },
  follows: {
    byUser: (userId: number) => `/follows/${userId}`,
  },
  events: {
    root: '/events/',
    current: '/events/?status=current',
    admin: '/events/admin',
    byId: (eventId: number) => `/events/${eventId}`,
  },
  messages: {
    conversations: '/messages/conversations',
    unreadCount: '/messages/unread-count',
    // Thread between current user and `otherUserId`. The backend route is
    // /messages/{other_user_id}, derived in Python from the DB rows that
    // join both directions — no conversation table exists.
    thread: (otherUserId: number) => `/messages/${otherUserId}`,
    deleteConversation: (otherUserId: number) => `/messages/${otherUserId}`,
    websocket: (token: string) => `/messages/ws/${token}`,
  },
  matches: {
    // Server computes matches deterministically against seeded ARDD
    // attendees on every call — there's no `Match` table, so callers
    // should expect the response payload, not a list endpoint.
    me: '/matches/me',
    compare: (candidateId: number) => `/matches/compare/${candidateId}`,
  },
  sessions: {
    list: '/sessions/',
    recommended: '/sessions/recommended',
    my: '/sessions/my',
    star: (sessionId: number) => `/sessions/${sessionId}/star`,
  },
  bot: {
    query: '/bot/query',
    intents: '/bot/intents',
    context: '/bot/context',
  },
  media: {
    upload: '/media/upload',
  },
} as const;
