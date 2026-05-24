import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { AuthPrompt } from '@/components/auth-prompt';
import { LoadingState } from '@/components/loading-state';
import type { NotificationItem } from '@/store/types';

const iconFor = (type: string) => {
  if (type === 'message') return 'chatbubble-outline';
  if (type === 'like') return 'heart-outline';
  if (type === 'repost') return 'repeat-outline';
  if (type === 'comment') return 'chatbox-ellipses-outline';
  if (type === 'post') return 'newspaper-outline';
  return 'notifications-outline';
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuthStore();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await apiClient.get<NotificationItem[]>('/notifications/');
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openNotification = async (item: NotificationItem) => {
    if (!item.read_at) {
      await apiClient.post(`/notifications/${item.id}/read`);
      setItems((current) =>
        current.map((n) =>
          n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
    }

    if (item.target_type === 'user' && item.target_id) {
      router.push({
        pathname: '/chat/[otherUserId]',
        params: { otherUserId: String(item.target_id), name: item.actor?.full_name || 'Chat' },
      });
    } else if (item.target_type === 'post' && item.target_id) {
      router.push(`/posts/${item.target_id}` as never);
    }
  };

  const markAllRead = async () => {
    await apiClient.post('/notifications/read-all');
    setItems((current) =>
      current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })),
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <AuthPrompt message="Sign in to view notifications" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} tintColor={Colors.primary} />}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <View>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 26, color: Colors.textPrimary }}>Notifications</Text>
          <Text style={{ marginTop: 4, fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>
            Messages, likes, posts, reposts, and comments.
          </Text>
        </View>
        <Pressable onPress={markAllRead} hitSlop={8}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.primary }}>Mark read</Text>
        </Pressable>
      </View>

      {loading ? (
        <LoadingState message="Loading notifications..." />
      ) : items.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 80, gap: 12 }}>
          <Ionicons name="notifications-outline" size={48} color={Colors.textTertiary} />
          <Text style={{ fontFamily: Fonts.medium, fontSize: 15, color: Colors.textSecondary }}>
            No notifications yet
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((item) => {
            const unread = !item.read_at;
            return (
              <Pressable
                key={item.id}
                onPress={() => openNotification(item)}
                style={({ pressed }) => ({
                  backgroundColor: unread ? Colors.primaryLight : Colors.card,
                  borderRadius: 12,
                  borderCurve: 'continuous',
                  borderWidth: 1,
                  borderColor: unread ? Colors.primary : Colors.border,
                  padding: 14,
                  flexDirection: 'row',
                  gap: 12,
                  opacity: pressed ? 0.82 : 1,
                })}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: Colors.card,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={iconFor(item.type) as any} size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary }}>
                    {item.title}
                  </Text>
                  {item.body ? (
                    <Text numberOfLines={2} style={{ fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18, color: Colors.textSecondary }}>
                      {item.body}
                    </Text>
                  ) : null}
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textTertiary }}>
                    {new Date(item.created_at).toLocaleString()}
                  </Text>
                </View>
                {unread ? <View style={{ marginTop: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary }} /> : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
