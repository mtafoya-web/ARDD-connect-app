import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/badge';
import { Avatar } from '@/components/avatar';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';

interface EventDetail {
  id: number;
  title: string;
  description?: string;
  event_type?: string;
  session_type?: string;
  location?: string;
  hall?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  topics?: string[];
  speakers?: string[];
  is_starred?: boolean;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuthStore();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starring, setStarring] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      const numericId = Number(id);
      if (!id || !Number.isFinite(numericId)) {
        setError('Invalid event ID');
        setLoading(false);
        return;
      }
      try {
        const data = await apiClient.get<EventDetail>(`/sessions/${numericId}`);
        setEvent(data);
      } catch (e: unknown) {
        // Try events endpoint as fallback
        try {
          const data = await apiClient.get<EventDetail>(`/events/${numericId}`);
          setEvent(data);
        } catch {
          setError(e instanceof Error ? e.message : 'Failed to load event');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleStar = async () => {
    if (!isLoggedIn || !event) return;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;
    setStarring(true);
    try {
      const newStarred = !event.is_starred;
      await apiClient.post(`/sessions/${numericId}/star`, { star: newStarred });
      setEvent({ ...event, is_starred: newStarred });
    } catch {
      // Silent
    } finally {
      setStarring(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <LoadingState />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <ErrorState message={error || 'Event not found'} onRetry={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 16, gap: 20 }}
    >
      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        hitSlop={8}
      >
        <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: Colors.textPrimary }}>
          Back
        </Text>
      </Pressable>

      {/* Event header */}
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {(event.event_type || event.session_type) && (
            <Badge label={event.event_type || event.session_type || ''} variant="primary" size="md" />
          )}
        </View>
        <Text selectable style={{ fontFamily: Fonts.bold, fontSize: 24, color: Colors.textPrimary, lineHeight: 30 }}>
          {event.title}
        </Text>
      </View>

      {/* Description */}
      {event.description ? (
        <Text
          selectable
          style={{
            fontFamily: Fonts.regular,
            fontSize: 15,
            color: Colors.textSecondary,
            lineHeight: 22,
          }}
        >
          {event.description}
        </Text>
      ) : null}

      {/* Metadata */}
      <View
        style={{
          backgroundColor: Colors.card,
          borderRadius: 12,
          borderCurve: 'continuous',
          padding: 16,
          gap: 12,
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        {(event.location || event.hall) ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="location-outline" size={18} color={Colors.primary} />
            <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: Colors.textPrimary }}>
              {event.hall || event.location}
            </Text>
          </View>
        ) : null}
        {event.date ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: Colors.textPrimary }}>
              {event.date}
            </Text>
          </View>
        ) : null}
        {event.start_time ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="time-outline" size={18} color={Colors.primary} />
            <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: Colors.textPrimary }}>
              {event.start_time}{event.end_time ? ` – ${event.end_time}` : ''}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Speakers */}
      {Array.isArray(event.speakers) && event.speakers.length > 0 && (
        <View
          style={{
            backgroundColor: Colors.card,
            borderRadius: 12,
            borderCurve: 'continuous',
            padding: 16,
            gap: 12,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary }}>
            Speakers
          </Text>
          {event.speakers.map((speaker, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar name={speaker} size={32} />
              <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: Colors.textPrimary }}>
                {speaker}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Topics */}
      {Array.isArray(event.topics) && event.topics.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {event.topics.map((topic, i) => (
            <Badge key={i} label={topic} variant="primary" size="md" />
          ))}
        </View>
      )}

      {/* Star/Save button */}
      {isLoggedIn ? (
        <Pressable
          onPress={handleStar}
          disabled={starring}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: event.is_starred ? Colors.primaryLight : Colors.primary,
            borderRadius: 12,
            borderCurve: 'continuous',
            paddingVertical: 14,
            opacity: pressed ? 0.85 : starring ? 0.6 : 1,
          })}
        >
          <Ionicons
            name={event.is_starred ? 'star' : 'star-outline'}
            size={18}
            color={event.is_starred ? Colors.primary : Colors.white}
          />
          <Text
            style={{
              fontFamily: Fonts.semiBold,
              fontSize: 15,
              color: event.is_starred ? Colors.primary : Colors.white,
            }}
          >
            {event.is_starred ? 'Saved to schedule' : 'Save to my schedule'}
          </Text>
        </Pressable>
      ) : (
        <View
          style={{
            backgroundColor: Colors.inputBg,
            borderRadius: 12,
            borderCurve: 'continuous',
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Ionicons name="lock-closed-outline" size={18} color={Colors.textTertiary} />
          <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary }}>
            Sign in to save this session
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
