import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Avatar } from '@/components/avatar';
import { AuthPrompt } from '@/components/auth-prompt';
import { LoadingState } from '@/components/loading-state';
import type { Conversation } from '@/store/types';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiClient.get<any>('/messages');
      console.log('MESSAGES RESPONSE:', data);
      const normalizedMessages = Array.isArray(data)
        ? data
        : Array.isArray(data.messages)
          ? data.messages
          : Array.isArray(data.items)
            ? data.items
            : [];
      setConversations(normalizedMessages);
    } catch (err) {
      console.error('MESSAGES FETCH ERROR:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  if (!isLoggedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <AuthPrompt message="Sign in to view your messages" />
      </View>
    );
  }

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
          onChangeText={setSearchQuery}
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
      ) : conversations.length === 0 ? (
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
            onPress={() => {}}
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
          {(() => { console.log('messages value:', conversations); console.log('messages is array:', Array.isArray(conversations)); return null; })()}
          {Array.isArray(conversations) && conversations.map((conv) => (
            <Pressable
              key={conv.id}
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
              <Avatar name={conv.participant.full_name} size={44} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary }}>
                  {conv.participant.full_name}
                </Text>
                {conv.last_message && (
                  <Text
                    style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {conv.last_message}
                  </Text>
                )}
              </View>
              {conv.unread_count && conv.unread_count > 0 && (
                <View
                  style={{
                    backgroundColor: Colors.primary,
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 6,
                  }}
                >
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.white, fontVariant: ['tabular-nums'] }}>
                    {conv.unread_count}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
