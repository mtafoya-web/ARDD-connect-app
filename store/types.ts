export interface Preferences {}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  bio?: string;
  institution?: string;
  role?: string;
  research_focus?: string;
  location?: string;
  research_interests?: string;
  looking_for?: string;
  conference_goals?: string[];
  availability?: string[];
  followers_count?: number;
  following_count?: number;
  avatar_url?: string;
}

export interface Post {
  id: number;
  author: User;
  title?: string;
  body: string;
  post_type?: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  created_at: string;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  event_type: string;
  location?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  hall?: string;
}

export interface Session {
  id: number;
  title: string;
  description?: string;
  session_type?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  hall?: string;
  topics?: string[];
  speakers?: string[];
  match_score?: number;
  match_reasons?: string[];
  is_starred?: boolean;
}

export interface Match {
  id: number;
  user: User;
  score: number;
  match_type?: string;
  quote?: string;
  reasons?: string[];
  conversation_starter?: string;
}

export interface Conversation {
  id: number;
  participant: User;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

export interface Message {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
}
