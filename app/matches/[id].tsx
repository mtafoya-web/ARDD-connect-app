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
  you: User;
  them: User;
  reasons?: string[];
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
      if (!id || id === 'undefined') {
        setError('Invalid match ID');
        setLoading(false);
        return;
      }
      try {
        const data = await apiClient.get<MatchDetail>(`/matches/me/${id}`);
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
          {person.institution && (
            <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textSecondary }}>
              {person.institution}
            </Text>
          )}
        </View>
      </View>
      {person.role && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="business-outline" size={12} color={Colors.textTertiary} />
          <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
            {person.role}
          </Text>
        </View>
      )}
      {person.research_focus && (
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
      )}
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
          {match.match_type && (
            <Badge label={match.match_type} variant="outline" size="md" />
          )}
        </View>
      </View>

      {/* Side-by-side profiles */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ProfileCard label="YOU" person={match.you || user!} />
        <ProfileCard label="THEM" person={match.them} />
      </View>

      {/* Why this match */}
      {match.reasons && (Array.isArray(match.reasons) ? match.reasons : []).length > 0 && (
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
          {(Array.isArray(match.reasons) ? match.reasons : []).map((reason, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Text style={{ color: Colors.primary, fontSize: 16, lineHeight: 20 }}>{'•'}</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, flex: 1, lineHeight: 20 }}>
                {reason}
              </Text>
            </View>
          ))}

          {/* Conversation starter */}
          {match.conversation_starter && (
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
                {match.conversation_starter}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
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
          }}
        >
          <Ionicons name="people" size={16} color={Colors.white} />
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.white }}>
            Request intro
          </Text>
        </Pressable>
        <Pressable
          onPress={() => match.them && router.push(`/users/${match.them.id}` as never)}
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
