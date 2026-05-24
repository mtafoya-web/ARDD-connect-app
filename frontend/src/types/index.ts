export interface ARDDParticipantMetadata {
  role?: string;
  orgType?: string;
  companyStage?: string;
  researchFocus?: string[];
  businessGoals?: string[];
  sessionsOfInterest?: number[];
  availability?: string[];
  preferredIntroStyle?: string;
  channels?: string[];
  introTagline?: string;
  seed?: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone_number?: string | null;
  full_name: string;
  bio?: string;
  affiliation: string;
  role: string;
  is_superuser?: boolean;
  area_of_study: string;
  research_interests?: string;
  looking_for?: string;
  location?: string;
  website?: string;
  profile_photo_url?: string;
  profile_photo_public_id?: string;
  ardd_meta?: ARDDParticipantMetadata | null;
  followers_count?: number;
  following_count?: number;
  created_at?: string;
}

export interface ARDDMatchPublicProfile {
  id: number;
  username: string;
  full_name: string;
  affiliation: string;
  bio: string;
  profile_photo_url?: string;
  role?: string;
  orgType?: string;
  companyStage?: string;
  researchFocus?: string[];
  businessGoals?: string[];
  availability?: string[];
  introTagline?: string;
}

export interface ARDDMatchExplanation {
  bullets: string[];
  sharedFocus: string[];
  complementaryGoals: { a: string; b: string }[];
  conversationStarter: string;
  source: 'deterministic' | 'llm' | 'hybrid';
}

export interface ARDDMatchCard {
  matchId: string;
  userId: number;
  candidateId: number;
  candidate: ARDDMatchPublicProfile;
  score: number;
  scenario: string;
  reasons: ARDDMatchExplanation;
}

export interface ARDDMatchesResponse {
  me: ARDDMatchPublicProfile;
  matches: ARDDMatchCard[];
}

export interface ARDDMatchCompareResponse {
  me: ARDDMatchPublicProfile;
  them: ARDDMatchPublicProfile;
  score: number;
  scenario: string;
  reasons: ARDDMatchExplanation;
}

export interface UserPhotoResponse {
  profile_photo_url: string;
  profile_photo_public_id?: string;
}

export interface MediaItem {
  type: string;
  url: string;
  publicId?: string;
  altText?: string;
}

/**
 * Shape returned by POST /media/upload. Resource type is normalized to
 * "image" | "video" by the backend (Cloudinary's 'auto' resolves it),
 * but we keep it as `string` to stay forward-compatible.
 */
export interface MediaUploadResult {
  url: string;
  public_id: string;
  format: string;
  resource_type: string;
}

export interface Post {
  id: number;
  title?: string;
  content: string;
  category: string;
  status: string;
  media: MediaItem[];
  user_id: number;
  username: string;
  created_at: string;
  updated_at?: string;
  author?: User;
  user?: User;

  parent_id?: number;
  post_type: string;
  repost_of?: Pick<Post, 'id' | 'title' | 'content' | 'user_id' | 'username' | 'author'> | null;
  likes_count: number;
  bookmarks_count: number;
  replies_count: number;
  reposts_count: number;
  liked_by_me: boolean;
  bookmarked_by_me: boolean;
  reposted_by_me: boolean;
}

export interface ARDDSessionMetadata {
  sessionType?: string;
  topicTags?: string[];
  speakers?: { name: string; affiliation?: string }[];
  room?: string;
  track?: string;
  seed?: boolean;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  image_url?: string;
  status: 'draft' | 'current' | 'past';
  created_by: number;
  created_at: string;
  updated_at: string;
  ardd_meta?: ARDDSessionMetadata | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  username: string;
  email: string;
  phone_number?: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

/**
 * /auth/password-reset/request optionally includes `reset_token` so the
 * demo flow can prefill the confirmation form without going through email.
 * Production deployments would strip it server-side.
 */
export interface PasswordResetRequestResponse {
  message: string;
  reset_token?: string;
}

export interface PasswordResetConfirmResponse {
  message: string;
}

export interface BotSessionRef {
  id: number;
  title: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  room?: string;
  sessionType?: string;
}

/**
 * Backend returns several attachment shapes (`session`, `match`, `post`).
 * The UI only renders `session` today; the others pass through untyped so
 * future renderers can opt in without a normalizer change.
 */
export interface BotAttachment {
  type: string;
  session?: BotSessionRef;
  match?: unknown;
  post_id?: number;
  sentiment?: string;
  takeaway?: string;
}

export interface BotReply {
  intent: string;
  response: string;
  attachments: BotAttachment[];
}

export interface BotIntent {
  intent: string;
  label: string;
  sample: string;
}

export interface SessionDTO {
  id: number;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  sessionType?: string;
  topicTags?: string[];
  speakers?: { name: string; affiliation?: string }[];
  room?: string;
  track?: string;
  score?: number | null;
  reasons?: string[] | null;
  starred?: boolean;
}

export interface StarSessionResponse {
  starred: boolean;
  sessionsOfInterest: number[];
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  read_at?: string | null;
  created_at: string;
}

export interface Conversation {
  user: Partial<User>;
  last_message: string;
  last_message_at: string;
  unread_count?: number;
}

export interface NotificationItem {
  id: number;
  type: 'message' | 'like' | 'post' | 'repost' | 'comment' | string;
  title: string;
  body?: string;
  target_type?: string | null;
  target_id?: number | null;
  read_at?: string | null;
  created_at: string;
  actor?: Pick<User, 'id' | 'username' | 'full_name' | 'profile_photo_url'> | null;
}

export interface NotificationUnreadCount {
  unread_count: number;
}
