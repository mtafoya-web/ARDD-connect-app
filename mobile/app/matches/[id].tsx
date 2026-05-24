import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Avatar } from '@/components/avatar';
import { Badge } from '@/components/badge';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import type { User } from '@/store/types';

interface MatchDetail {
  id: number;
  score: number;
  match_type?: string;
  scenario?: string;
  you: User;
  me?: User;
  them: User;
  reasons?: string[] | { bullets?: string[]; sharedFocus?: string[]; complementaryGoals?: string[]; conversationStarter?: string };
  conversation_starter?: string;
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatch = async () => {
      const numericId = Number(id);
      if (!id || id === 'undefined' || !Number.isFinite(numericId)) {
        setError('Invalid match ID');
        setLoading(false);
        return;
      }
      try {
        const data = await apiClient.get<MatchDetail>(`/matches/compare/${numericId}`);
        setMatch(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load match');
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <LoadingState />
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <ErrorState message={error || 'Match not found'} onRetry={() => router.back()} />
      </View>
    );
  }

  // Normalize reasons from different API shapes
  const rawReasons = match.reasons;
  const normalizedReasons: string[] = Array.isArray(rawReasons)
    ? rawReasons
    : Array.isArray((rawReasons as any)?.bullets)
      ? (rawReasons as any).bullets
      : [];
  const conversationStarter = match.conversation_starter
    ?? (!Array.isArray(rawReasons) ? (rawReasons as any)?.conversationStarter : undefined)
    ?? '';
  const matchType = match.match_type ?? match.scenario ?? '';

  // Handle both 'you'/'me' fields from API
  const meProfile = match.you ?? match.me ?? user!;
  const themProfile = match.them;

  const ProfileCard = ({ label, person }: { label: string; person: User }) => (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.card,
        borderRadius: 12,
        borderCurve: 'continuous',
        padding: 14,
        gap: 10,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Avatar name={person.full_name} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary }}>
            {person.full_name}
          </Text>
          {person.institution ? (
            <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textSecondary }}>
              {person.institution}
            </Text>
          ) : null}
        </View>
      </View>
      {person.role ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="business-outline" size={12} color={Colors.textTertiary} />
          <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
            {person.role}
          </Text>
        </View>
      ) : null}
      {person.research_focus ? (
        <View style={{ gap: 4 }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 10, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            RESEARCH FOCUS
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            <View style={{ backgroundColor: Colors.inputBg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: Colors.textSecondary }}>
                {person.research_focus}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
      {Array.isArray(person.conference_goals) && person.conference_goals.length > 0 && (
        <View style={{ gap: 4 }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 10, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            CONFERENCE GOALS
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {person.conference_goals.map((goal, i) => (
              <View key={i} style={{ backgroundColor: Colors.primaryLight, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: Colors.primary }}>
                  {goal}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {Array.isArray(person.availability) && person.availability.length > 0 && (
        <View style={{ gap: 4 }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 10, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            AVAILABILITY
          </Text>
          {person.availability.map((slot, i) => (
            <Text key={i} style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textSecondary }}>
              {slot}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 16, gap: 20 }}
    >
      {/* Back */}
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

      {/* Header */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
          SIDE-BY-SIDE MATCH
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 28, color: Colors.textPrimary }}>
            Match · {match.score}
          </Text>
          {matchType ? (
            <Badge label={matchType} variant="outline" size="md" />
          ) : null}
        </View>
      </View>

      {/* Side-by-side profiles */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ProfileCard label="YOU" person={meProfile} />
        <ProfileCard label="THEM" person={themProfile} />
      </View>

      {/* Why this match */}
      {(normalizedReasons.length > 0 || conversationStarter) && (
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
          <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary }}>
            Why this match
          </Text>
          {normalizedReasons.map((reason, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Text style={{ color: Colors.primary, fontSize: 16, lineHeight: 20 }}>{'•'}</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, flex: 1, lineHeight: 20 }}>
                {reason}
              </Text>
            </View>
          ))}

          {/* Conversation starter */}
          {conversationStarter ? (
            <View
              style={{
                backgroundColor: Colors.background,
                borderRadius: 10,
                borderCurve: 'continuous',
                padding: 14,
                gap: 6,
                marginTop: 4,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="chatbox-outline" size={13} color={Colors.textTertiary} />
                <Text style={{ fontFamily: Fonts.semiBold, fontSize: 10, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  CONVERSATION STARTER
                </Text>
              </View>
              <Text selectable style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 }}>
                {conversationStarter}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <Pressable
          onPress={() => {
            const themId = themProfile?.id;
            if (themId && Number.isFinite(Number(themId))) {
              router.push({
                pathname: '/chat/[otherUserId]',
                params: {
                  otherUserId: String(themId),
                  name: themProfile?.full_name ?? themProfile?.username ?? 'Chat',
                },
              });
            }
          }}
          style={{
            backgroundColor: Colors.primary,
            borderRadius: 10,
            borderCurve: 'continuous',
            paddingVertical: 12,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="chatbubble" size={16} color={Colors.white} />
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.white }}>
            Message
          </Text>
        </Pressable>
        <Pressable
          onPress={() => themProfile && router.push(`/users/${themProfile.id}` as never)}
          style={{
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 10,
            borderCurve: 'continuous',
            paddingVertical: 12,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary }}>
            View full profile
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
