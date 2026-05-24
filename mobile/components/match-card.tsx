import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Avatar } from './avatar';
import { Badge } from './badge';
import type { Match } from '@/store/types';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();

  const candidateId = match.candidateId ?? match.candidate?.id;
  const candidateName = match.candidate?.full_name ?? match.candidate?.username ?? 'Chat';
  const isValidCandidateId = candidateId != null && Number.isFinite(Number(candidateId));
  const reasonBullets = Array.isArray(match.reasons?.bullets) ? match.reasons.bullets : [];
  const conversationStarter = match.reasons?.conversationStarter ?? '';

  const handleMessage = () => {
    if (!isValidCandidateId) return;
    router.push({
      pathname: '/chat/[otherUserId]',
      params: { otherUserId: String(candidateId), name: candidateName },
    });
  };

  const handleSideBySide = () => {
    if (!isValidCandidateId) return;
    router.push({
      pathname: '/matches/compare/[candidateId]',
      params: { candidateId: String(candidateId) },
    });
  };

  return (
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
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar name={candidateName} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.textPrimary }}>
            {candidateName}
          </Text>
          {match.candidate?.affiliation ? (
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
              {match.candidate.affiliation}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Ionicons name="sparkles" size={14} color={Colors.primary} />
          <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: Colors.primary, fontVariant: ['tabular-nums'] }}>
            {match.score}
          </Text>
        </View>
      </View>

      {/* Scenario tag */}
      {match.scenario ? (
        <Badge label={match.scenario.replace(/_/g, ' ')} variant="outline" size="sm" />
      ) : null}

      {/* Intro tagline */}
      {match.candidate?.introTagline ? (
        <Text
          style={{
            fontFamily: Fonts.regular,
            fontSize: 13,
            color: Colors.textSecondary,
            fontStyle: 'italic',
            lineHeight: 18,
          }}
        >
          {`“${match.candidate.introTagline}”`}
        </Text>
      ) : null}

      {/* Reasons */}
      {reasonBullets.length > 0 && (
        <View style={{ gap: 4 }}>
          {reasonBullets.map((reason, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
              <Text style={{ color: Colors.primary, fontSize: 14 }}>{'•'}</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, flex: 1 }}>
                {reason}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Conversation starter */}
      {conversationStarter ? (
        <View
          style={{
            backgroundColor: Colors.background,
            borderRadius: 8,
            borderCurve: 'continuous',
            padding: 12,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <Ionicons name="chatbox-outline" size={14} color={Colors.textTertiary} />
          <Text
            style={{
              fontFamily: Fonts.regular,
              fontSize: 12,
              color: Colors.textSecondary,
              flex: 1,
              lineHeight: 17,
            }}
          >
            {conversationStarter}
          </Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 10, paddingTop: 4 }}>
        <Pressable
          onPress={handleSideBySide}
          style={{
            backgroundColor: Colors.primary,
            borderRadius: 8,
            borderCurve: 'continuous',
            paddingVertical: 8,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.white }}>
            See side-by-side
          </Text>
          <Ionicons name="open-outline" size={12} color={Colors.white} />
        </Pressable>
        <Pressable
          onPress={handleMessage}
          style={{
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 8,
            borderCurve: 'continuous',
            paddingVertical: 8,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chatbubble-outline" size={12} color={Colors.textPrimary} />
          <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: Colors.textPrimary }}>
            Message
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
