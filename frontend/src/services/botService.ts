/**
 * Bot service (ARDD Claw Bot).
 *
 * The bot is entirely deterministic server-side — it answers from live
 * DB context (profile, schedule, sessions, matches) and never calls an
 * external LLM. So errors here are always backend errors, not LLM
 * flakiness, and the UI should surface them as such.
 */
import client from '../api/client';
import { API_ROUTES } from '../constants/apiRoutes';
import {
  normalizeBotIntents,
  normalizeBotReply,
} from '../lib/normalize';
import type { BotIntent, BotReply } from '../types';

export async function getBotIntents(): Promise<BotIntent[]> {
  const res = await client.get(API_ROUTES.bot.intents);
  return normalizeBotIntents(res.data);
}

export async function queryBot(text: string): Promise<BotReply> {
  const res = await client.post(API_ROUTES.bot.query, { text });
  return normalizeBotReply(res.data);
}
