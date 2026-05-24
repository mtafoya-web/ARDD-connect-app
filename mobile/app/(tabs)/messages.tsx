import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Avatar } from '@/components/avatar';
import { AuthPrompt } from '@/components/auth-prompt';
import { LoadingState } from '@/components/loading-state';
import type { Conversation, User } from '@/store/types';

function formatTimestamp(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiClient.get<any>('/messages/conversations');
      const safeConversations = Array.isArray(data) ? data : [];
      setConversations(safeConversations);
    } catch (err) {
      console.error('[Messages] fetch error:', err instanceof Error ? err.message : err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearching(false);
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const data = await apiClient.get<User[]>(`/users/?q=${encodeURIComponent(query.trim())}`);
      const safeUsers = Array.isArray(data) ? data : [];
      setSearchResults(safeUsers.filter((item) => item.id !== user?.id));
    } catch (err) {
      console.error('[Messages] search error:', err instanceof Error ? err.message : err);
      setSearchResults([]);
    }
  }, [user?.id]);

  const openChat = (target: Pick<User, 'id' | 'full_name' | 'username'>) => {
    if (!target.id || !Number.isFinite(Number(target.id))) return;
    const displayName = target.full_name || target.username || 'Chat';
    router.push({
      pathname: '/chat/[otherUserId]',
      params: { otherUserId: String(target.id), name: displayName },
    });
  };

  if (!isLoggedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <AuthPrompt message="Sign in to view your messages" />
      </View>
    );
  }

  const safeConversations = Array.isArray(conversations) ? conversations : [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 16, gap: 16 }}
    >
      {/* Header */}
      <Text style={{ fontFamily: Fonts.bold, fontSize: 26, color: Colors.textPrimary }}>
        Messages
      </Text>

      {/* Search */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: Colors.card,
          borderRadius: 10,
          borderCurve: 'continuous',
          paddingHorizontal: 14,
          paddingVertical: 10,
          gap: 10,
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <Ionicons name="search" size={18} color={Colors.textTertiary} />
        <TextInput
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search people to message..."
          placeholderTextColor={Colors.textTertiary}
          style={{
            flex: 1,
            fontFamily: Fonts.regular,
            fontSize: 14,
            color: Colors.textPrimary,
          }}
        />
      </View>

      {/* Content */}
      {loading ? (
        <LoadingState message="Loading conversations..." />
      ) : searching ? (
        <View style={{ gap: 2 }}>
          {searchResults.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48, gap: 8 }}>
              <Ionicons name="search-outline" size={36} color={Colors.textTertiary} />
              <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: Colors.textSecondary }}>
                No people found
              </Text>
            </View>
          ) : (
            searchResults.map((target) => {
              const displayName = target.full_name || target.username || 'Unknown';
              return (
                <Pressable
                  key={target.id}
                  onPress={() => openChat(target)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    backgroundColor: pressed ? Colors.inputBg : Colors.card,
                    borderRadius: 10,
                    borderCurve: 'continuous',
                  })}
                >
                  <Avatar name={displayName} size={44} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary }}>
                      {displayName}
                    </Text>
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
                      @{target.username}
                    </Text>
                  </View>
                  <Ionicons name="chatbubble-outline" size={16} color={Colors.textTertiary} />
                </Pressable>
              );
            })
          )}
        </View>
      ) : safeConversations.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 80, gap: 16 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: Colors.inputBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chatbubbles-outline" size={28} color={Colors.textTertiary} />
          </View>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 17, color: Colors.textPrimary }}>
            No conversations yet
          </Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, textAlign: 'center' }}>
            Search for someone above to start chatting
          </Text>
          <Pressable
            onPress={() => router.push('/people' as never)}
            style={{
              backgroundColor: Colors.primary,
              borderRadius: 10,
              borderCurve: 'continuous',
              paddingVertical: 12,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 8,
            }}
          >
            <Ionicons name="people-outline" size={16} color={Colors.white} />
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.white }}>
              New Message
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 2 }}>
          {safeConversations.map((conv, index) => {
            const displayName = conv.user?.full_name ?? conv.user?.username ?? 'Unknown';
            const uniqueKey = conv.user?.id ?? index;
            const userId = conv.user?.id;
            const isValidUserId = userId != null && Number.isFinite(Number(userId));

            const handlePress = () => {
              if (!isValidUserId) return;
              openChat({
                id: Number(userId),
                full_name: conv.user?.full_name || displayName,
                username: conv.user?.username || '',
              });
            };

            return (
              <Pressable
                key={uniqueKey}
                onPress={handlePress}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  backgroundColor: pressed ? Colors.inputBg : Colors.card,
                  borderRadius: 10,
                  borderCurve: 'continuous',
                })}
              >
                <Avatar name={displayName} size={44} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary }}>
                    {displayName}
                  </Text>
                  {conv.last_message ? (
                    <Text
                      style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}
                      numberOfLines={1}
                    >
                      {conv.last_message}
                    </Text>
                  ) : null}
                  {conv.last_message_at ? (
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textTertiary }}>
                      {formatTimestamp(conv.last_message_at)}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
