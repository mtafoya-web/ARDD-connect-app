import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { apiClient } from '@/lib/api-client';
import { Avatar } from '@/components/avatar';
import { Badge } from '@/components/badge';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';

interface CompareProfile {
  id?: number;
  username?: string;
  full_name?: string;
  institution?: string;
  affiliation?: string;
  role?: string;
  bio?: string;
  introTagline?: string;
  researchFocus?: string[];
  research_focus?: string;
  businessGoals?: string[];
  conference_goals?: string[];
  availability?: string[];
}

interface CompareReasons {
  bullets?: string[];
  sharedFocus?: string[];
  complementaryGoals?: string[];
  conversationStarter?: string;
}

interface CompareData {
  me: CompareProfile;
  them: CompareProfile;
  score: number;
  scenario?: string;
  reasons?: CompareReasons | string[];
  conversation_starter?: string;
}

export default function MatchCompareScreen() {
  const { candidateId } = useLocalSearchParams<{ candidateId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const numericId = Number(candidateId);
  const isValidId = candidateId && candidateId !== 'undefined' && candidateId !== 'null' && Number.isFinite(numericId);
  const isWide = width > 700;

  useEffect(() => {
    const fetchCompare = async () => {
      if (!isValidId) {
        setError('Invalid candidate ID');
        setLoading(false);
        return;
      }
      try {
        setError(null);
        const result = await apiClient.get<CompareData>(`/matches/compare/${numericId}`);
        setData(result);
      } catch (e: unknown) {
        console.error('[Compare] fetch error:', e instanceof Error ? e.message : e);
        setError(e instanceof Error ? e.message : 'Failed to load comparison');
      } finally {
        setLoading(false);
      }
    };
    fetchCompare();
  }, [isValidId, numericId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <LoadingState />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <ErrorState message={error || 'Comparison not found'} onRetry={() => router.back()} />
      </View>
    );
  }

  const themName = data?.them?.full_name ?? data?.them?.username ?? 'Them';

  // Extract reasons safely
  const reasons = data?.reasons;
  const bullets: string[] = Array.isArray(reasons)
    ? reasons
    : Array.isArray((reasons as CompareReasons)?.bullets)
      ? (reasons as CompareReasons).bullets!
      : [];
  const sharedFocus: string[] = !Array.isArray(reasons) && Array.isArray((reasons as CompareReasons)?.sharedFocus)
    ? (reasons as CompareReasons).sharedFocus!
    : [];
  const complementaryGoals: string[] = !Array.isArray(reasons) && Array.isArray((reasons as CompareReasons)?.complementaryGoals)
    ? (reasons as CompareReasons).complementaryGoals!
    : [];
  const conversationStarter = !Array.isArray(reasons)
    ? (reasons as CompareReasons)?.conversationStarter ?? data?.conversation_starter ?? ''
    : data?.conversation_starter ?? '';

  const ProfileCard = ({ label, person }: { label: string; person: CompareProfile }) => {
    const personName = person?.full_name ?? person?.username ?? (label === 'YOU' ? 'You' : 'Them');
    const personInstitution = person?.institution ?? person?.affiliation ?? '';
    const personRole = person?.role ?? '';
    const tagline = person?.introTagline ?? person?.bio ?? '';
    const focus = Array.isArray(person?.researchFocus)
      ? person.researchFocus
      : person?.research_focus
        ? [person.research_focus]
        : [];
    const goals = Array.isArray(person?.businessGoals)
      ? person.businessGoals
      : Array.isArray(person?.conference_goals)
        ? person.conference_goals
        : [];
    const availability = Array.isArray(person?.availability) ? person.availability : [];

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.card,
          borderRadius: 12,
          borderCurve: 'continuous',
          padding: 16,
          gap: 12,
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar name={personName} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.textPrimary }}>
              {personName}
            </Text>
            {personInstitution ? (
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
                {personInstitution}
              </Text>
            ) : null}
          </View>
        </View>

        {tagline ? (
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 18 }}>
            {`“${tagline}”`}
          </Text>
        ) : null}

        {personRole ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="business-outline" size={13} color={Colors.textTertiary} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
              {personRole}
            </Text>
          </View>
        ) : null}

        {focus.length > 0 && (
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="flask-outline" size={12} color={Colors.textTertiary} />
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 10, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                RESEARCH FOCUS
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {focus.map((item, i) => (
                <View key={i} style={{ backgroundColor: Colors.inputBg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: Colors.textSecondary }}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {goals.length > 0 && (
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="people-outline" size={12} color={Colors.textTertiary} />
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 10, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                CONFERENCE GOALS
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {goals.map((goal, i) => (
                <View key={i} style={{ backgroundColor: Colors.primaryLight, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: Colors.primary }}>
                    {goal}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {availability.length > 0 && (
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 10, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                AVAILABILITY
              </Text>
            </View>
            {availability.map((slot, i) => (
              <Text key={i} style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
                {slot}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 28, color: Colors.textPrimary }}>
            Match · {data.score ?? 0}
          </Text>
          {data.scenario ? (
            <Badge label={data.scenario} variant="outline" size="md" />
          ) : null}
        </View>
      </View>

      {/* Side-by-side profiles */}
      <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 12 }}>
        <ProfileCard label="YOU" person={data.me ?? {}} />
        <ProfileCard label="THEM" person={data.them ?? {}} />
      </View>

      {/* Why this match */}
      {(bullets.length > 0 || sharedFocus.length > 0 || complementaryGoals.length > 0 || conversationStarter) && (
        <View
          style={{
            backgroundColor: Colors.card,
            borderRadius: 12,
            borderCurve: 'continuous',
            padding: 16,
            gap: 14,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary }}>
            Why this match
          </Text>

          {/* Bullets */}
          {bullets.length > 0 && (
            <View style={{ gap: 6 }}>
              {bullets.map((reason, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Text style={{ color: Colors.primary, fontSize: 16, lineHeight: 20 }}>{'•'}</Text>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, flex: 1, lineHeight: 20 }}>
                    {reason}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Shared Focus */}
          {sharedFocus.length > 0 && (
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Shared Focus
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {sharedFocus.map((item, i) => (
                  <View key={i} style={{ backgroundColor: Colors.inputBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: Colors.textSecondary }}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Complementary Goals */}
          {complementaryGoals.length > 0 && (
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Complementary Goals
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {complementaryGoals.map((item, i) => (
                  <View key={i} style={{ backgroundColor: Colors.primaryLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: Colors.primary }}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Conversation Starter */}
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
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          onPress={() => {
            if (isValidId) {
              router.push({
                pathname: '/chat/[otherUserId]',
                params: { otherUserId: String(numericId), name: themName },
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
          onPress={() => {
            const themId = data?.them?.id;
            if (themId && Number.isFinite(Number(themId))) {
              router.push(`/users/${themId}` as never);
            }
          }}
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
