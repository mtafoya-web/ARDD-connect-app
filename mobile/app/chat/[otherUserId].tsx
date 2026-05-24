import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { API_BASE_URL } from '@/constants/Config';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import type { Message } from '@/store/types';

function getWebSocketUrl(apiBaseUrl: string, token: string): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  const wsBase = base.startsWith('https://')
    ? base.replace('https://', 'wss://')
    : base.replace('http://', 'ws://');
  return `${wsBase}/messages/ws/${token}`;
}

export default function ChatScreen() {
  const { otherUserId, name } = useLocalSearchParams<{ otherUserId: string; name?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const displayName = name || 'Chat';
  const numericOtherUserId = Number(otherUserId);
  const isValidId = otherUserId && otherUserId !== 'undefined' && otherUserId !== 'null' && Number.isFinite(numericOtherUserId);

  // Fetch existing messages
  const fetchMessages = useCallback(async () => {
    if (!isValidId) {
      setError('Invalid user ID');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await apiClient.get<any>(`/messages/${numericOtherUserId}`);
      const safeMessages = Array.isArray(data) ? data : [];
      setMessages(safeMessages);
    } catch (e: unknown) {
      console.error('[Chat] fetch error:', e instanceof Error ? e.message : e);
      setError(e instanceof Error ? e.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [isValidId, numericOtherUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // WebSocket connection
  useEffect(() => {
    if (!token || !isValidId) return;

    const wsUrl = getWebSocketUrl(API_BASE_URL, token);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Chat] WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const incoming = JSON.parse(event.data);
        if (
          incoming.sender_id === numericOtherUserId ||
          incoming.receiver_id === numericOtherUserId
        ) {
          setMessages((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            // Avoid duplicates
            const alreadyExists = safePrev.some(
              (m) => m.id === incoming.id && incoming.id != null
            );
            if (alreadyExists) return safePrev;
            return [...safePrev, incoming];
          });
        }
      } catch (err) {
        console.error('[Chat] WS parse error:', err);
      }
    };

    ws.onerror = (event) => {
      console.error('[Chat] WebSocket error:', event);
    };

    ws.onclose = () => {
      console.log('[Chat] WebSocket closed');
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token, isValidId, numericOtherUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim()) return;

    setSendError(null);

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setSendError('Connection not ready. Please try again.');
      return;
    }

    const payload = {
      receiver_id: numericOtherUserId,
      content: messageText.trim(),
    };

    ws.send(JSON.stringify(payload));

    // Optimistically add the message
    const optimisticMessage: Message = {
      id: Date.now(),
      sender_id: user?.id ?? 0,
      receiver_id: numericOtherUserId,
      content: messageText.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return [...safePrev, optimisticMessage];
    });
    setMessageText('');
  };

  if (!isValidId) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <ErrorState message="Invalid user ID" onRetry={() => router.back()} />
      </View>
    );
  }

  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: Colors.card,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 16, color: Colors.textPrimary }}>
            {displayName}
          </Text>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <LoadingState message="Loading messages..." />
        </View>
      ) : error ? (
        <View style={{ flex: 1 }}>
          <ErrorState message={error} onRetry={fetchMessages} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1, justifyContent: 'flex-end' }}
        >
          {safeMessages.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
              <Ionicons name="chatbubble-outline" size={40} color={Colors.textTertiary} />
              <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: Colors.textSecondary }}>
                No messages yet
              </Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textTertiary, textAlign: 'center' }}>
                Start the conversation with {displayName}
              </Text>
            </View>
          )}
          {safeMessages.map((msg, index) => {
            const isMe = msg.sender_id === (user?.id ?? 0);
            return (
              <View
                key={msg.id ?? index}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '78%',
                }}
              >
                <View
                  style={{
                    backgroundColor: isMe ? Colors.primary : Colors.card,
                    borderRadius: 16,
                    borderCurve: 'continuous',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderWidth: isMe ? 0 : 1,
                    borderColor: Colors.border,
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 4,
                  }}
                >
                  <Text
                    selectable
                    style={{
                      fontFamily: Fonts.regular,
                      fontSize: 14,
                      color: isMe ? Colors.white : Colors.textPrimary,
                      lineHeight: 20,
                    }}
                  >
                    {msg.content}
                  </Text>
                </View>
                {msg.created_at ? (
                  <Text
                    style={{
                      fontFamily: Fonts.regular,
                      fontSize: 10,
                      color: Colors.textTertiary,
                      marginTop: 3,
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      paddingHorizontal: 4,
                    }}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Send error */}
      {sendError && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 6, backgroundColor: Colors.primaryLight }}>
          <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: Colors.error, textAlign: 'center' }}>
            {sendError}
          </Text>
        </View>
      )}

      {/* Input */}
      <View
        style={{
          backgroundColor: Colors.card,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 10),
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 10,
        }}
      >
        <TextInput
          value={messageText}
          onChangeText={(text) => {
            setMessageText(text);
            if (sendError) setSendError(null);
          }}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textTertiary}
          multiline
          style={{
            flex: 1,
            fontFamily: Fonts.regular,
            fontSize: 15,
            color: Colors.textPrimary,
            backgroundColor: Colors.inputBg,
            borderRadius: 20,
            borderCurve: 'continuous',
            paddingHorizontal: 16,
            paddingVertical: 10,
            maxHeight: 100,
            borderWidth: 1,
            borderColor: Colors.inputBorder,
          }}
        />
        <Pressable
          onPress={handleSend}
          disabled={!messageText.trim()}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: messageText.trim() ? Colors.primary : Colors.inputBg,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons
            name="send"
            size={18}
            color={messageText.trim() ? Colors.white : Colors.textTertiary}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
