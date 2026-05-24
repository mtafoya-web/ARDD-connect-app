import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Heart, MessageSquare, Repeat2, Send, UserPlus } from 'lucide-react';
import type { NotificationItem } from '../types';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationsService';

const iconFor = (type: string) => {
  if (type === 'message') return MessageSquare;
  if (type === 'like') return Heart;
  if (type === 'repost') return Repeat2;
  if (type === 'comment') return Send;
  if (type === 'post') return UserPlus;
  return Bell;
};

const targetPath = (item: NotificationItem) => {
  if (item.target_type === 'post' && item.target_id) return `/post/${item.target_id}`;
  if (item.target_type === 'user' && item.target_id) return `/messages?userId=${item.target_id}`;
  return null;
};

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setItems(await getNotifications());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openNotification = async (item: NotificationItem) => {
    if (!item.read_at) {
      await markNotificationRead(item.id);
      setItems((current) =>
        current.map((n) =>
          n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
    }
    const path = targetPath(item);
    if (path) navigate(path);
  };

  const markAll = async () => {
    await markAllNotificationsRead();
    setItems((current) =>
      current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })),
    );
  };

  return (
    <main className="min-h-screen bg-canvas px-4 py-8 text-foreground-primary sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-accent">Activity</p>
            <h1 className="mt-1 text-3xl font-bold">Notifications</h1>
          </div>
          <button
            type="button"
            onClick={markAll}
            className="inline-flex items-center gap-2 rounded-lg border border-border-secondary bg-surface px-4 py-2 text-sm font-bold text-foreground-primary hover:bg-surface-muted"
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        </header>

        {loading ? (
          <div className="rounded-lg border border-border-secondary bg-surface p-8 text-center text-foreground-secondary">
            Loading notifications...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-primary bg-surface p-12 text-center text-foreground-secondary">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const Icon = iconFor(item.type);
              const unread = !item.read_at;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openNotification(item)}
                  className={`flex w-full gap-4 rounded-lg border p-4 text-left shadow-sm transition hover:border-border-primary ${
                    unread
                      ? 'border-accent/30 bg-accent/[0.04]'
                      : 'border-border-secondary bg-surface'
                  }`}
                >
                  <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-accent">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-foreground-primary">{item.title}</span>
                    {item.body ? (
                      <span className="mt-1 line-clamp-2 block text-sm leading-6 text-foreground-secondary">
                        {item.body}
                      </span>
                    ) : null}
                    <span className="mt-2 block text-xs text-foreground-tertiary">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </span>
                  {unread ? <span className="mt-2 h-2.5 w-2.5 rounded-full bg-accent" /> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};
