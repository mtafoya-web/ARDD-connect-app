/**
 * Messages service.
 *
 * Direct-message transport is split:
 *  - REST for history and conversation list (here).
 *  - WebSocket /messages/ws/{token} for live send/receive (UI-side).
 *
 * No conversation table exists server-side; threads are derived by
 * querying both directions on `Message`. That's why `getMessages` takes
 * the *other* user's id, not a conversation id.
 */
import client from '../api/client';
import { API_ROUTES } from '../constants/apiRoutes';
import { requireNumericId } from '../lib/ids';
import { normalizeConversations, normalizeMessages } from '../lib/normalize';
import type { Conversation, Message } from '../types';

export async function getConversations(): Promise<Conversation[]> {
  const res = await client.get(API_ROUTES.messages.conversations);
  return normalizeConversations(res.data);
}

export async function getUnreadMessageCount(): Promise<number> {
  const res = await client.get(API_ROUTES.messages.unreadCount);
  return Number(res.data?.unread_count) || 0;
}

export async function deleteConversation(otherUserId: unknown): Promise<void> {
  const id = requireNumericId(otherUserId);
  await client.delete(API_ROUTES.messages.deleteConversation(id));
}

/**
 * Full message history with `otherUserId`. The id must be a positive
 * integer — sending /messages/NaN would 422 and the chat panel would
 * silently stay empty.
 */
export async function getMessages(otherUserId: unknown): Promise<Message[]> {
  const id = requireNumericId(otherUserId);
  const res = await client.get(API_ROUTES.messages.thread(id));
  return normalizeMessages(res.data);
}
