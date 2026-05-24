import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { playNotificationSound } from '@/lib/notification-sound';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuthStore();
  const [unread, setUnread] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const hasLoadedUnread = useRef(false);
  const unreadRef = useRef({ notifications: 0, messages: 0 });

  const loadUnread = useCallback(async () => {
    if (!isLoggedIn) {
      setUnread(0);
      setUnreadMessages(0);
      return;
    }
    try {
      const [notificationData, messageData] = await Promise.all([
        apiClient.get<{ unread_count: number }>('/notifications/unread-count'),
        apiClient.get<{ unread_count: number }>('/messages/unread-count'),
      ]);
      const notificationCount = Number(notificationData.unread_count) || 0;
      const messageCount = Number(messageData.unread_count) || 0;
      if (
        hasLoadedUnread.current &&
        (notificationCount > unreadRef.current.notifications || messageCount > unreadRef.current.messages)
      ) {
        playNotificationSound();
      }
      hasLoadedUnread.current = true;
      unreadRef.current = { notifications: notificationCount, messages: messageCount };
      setUnread(notificationCount);
      setUnreadMessages(messageCount);
    } catch {
      setUnread(0);
      setUnreadMessages(0);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    loadUnread();
    const id = setInterval(loadUnread, 30000);
    return () => clearInterval(id);
  }, [loadUnread]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: Fonts.medium,
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: 'People',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: unreadMessages > 0 ? (unreadMessages > 9 ? '9+' : unreadMessages) : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarBadge: unread > 0 ? (unread > 9 ? '9+' : unread) : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
