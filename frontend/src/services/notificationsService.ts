import client from '../api/client';
import type { NotificationItem, NotificationUnreadCount } from '../types';

export async function getNotifications(limit = 50): Promise<NotificationItem[]> {
  const res = await client.get('/notifications/', { params: { limit } });
  return Array.isArray(res.data) ? res.data : [];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await client.get<NotificationUnreadCount>('/notifications/unread-count');
  return Number(res.data?.unread_count) || 0;
}

export async function markNotificationRead(id: number): Promise<NotificationItem> {
  const res = await client.post(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await client.post('/notifications/read-all');
}
