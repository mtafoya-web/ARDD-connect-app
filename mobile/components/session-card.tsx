import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Badge } from './badge';
import type { Session } from '@/store/types';

interface SessionCardProps {
  session: Session;
  showMatchScore?: boolean;
  showReasons?: boolean;
  onStar?: () => void;
}

export function SessionCard({ session, showMatchScore, showReasons, onStar }: SessionCardProps) {
  const router = useRouter();

  return (
    <View
      style={{
        backgroundColor: Colors.card,
        borderRadius: 12,
        borderCurve: 'continuous',
        gap: 0,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
      }}
    >
      {/* Session Image */}
      {session.image_url ? (
        <View style={{ height: 160, width: '100%' }}>
          <Image
            source={{ uri: session.image_url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          {session.sessionType && (
            <View style={{ position: 'absolute', top: 12, left: 12 }}>
              <Badge label={session.sessionType.toUpperCase()} variant="primary" size="sm" />
            </View>
          )}
        </View>
      ) : null}

      <View style={{ padding: 16, gap: 10 }}>
        {/* Meta row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          {!session.image_url && session.sessionType ? (
            <Badge label={session.sessionType} variant="primary" size="sm" />
          ) : null}
          {session.start_date ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
                <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase' }}>
                  {new Date(session.start_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: Colors.textSecondary }}>
                  {new Date(session.start_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  {session.end_date ? `–${new Date(session.end_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : ''}
                </Text>
              </View>
            </>
          ) : null}
          {(session.room || session.location) ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
              <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase' }}>
                {session.room || session.location}
              </Text>
            </View>
          ) : null}
          {showMatchScore && session.score != null && (
            <View style={{ marginLeft: 'auto' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="sparkles" size={13} color={Colors.primary} />
                <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.primary, fontVariant: ['tabular-nums'] }}>
                  {session.score}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Title */}
        <Text
          selectable
          style={{
            fontFamily: Fonts.semiBold,
            fontSize: 16,
            color: Colors.textPrimary,
            lineHeight: 22,
          }}
        >
          {session.title}
        </Text>

        {/* Topics */}
        {Array.isArray(session.topicTags) && session.topicTags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {session.topicTags.map((topic, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: Colors.primaryLight,
                  borderRadius: 14,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: Colors.primary }}>
                  {topic}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Match reasons */}
        {showReasons && Array.isArray(session.reasons) && session.reasons.length > 0 && (
          <View style={{ gap: 4 }}>
            {session.reasons.map((reason, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                <Text style={{ color: Colors.primary, fontSize: 14 }}>{'•'}</Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, flex: 1 }}>
                  {reason}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Speakers */}
        {Array.isArray(session.speakers) && session.speakers.length > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="people-outline" size={13} color={Colors.textTertiary} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textTertiary }} numberOfLines={1}>
              {session.speakers.map((s) => s.name).join(', ')}
            </Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border }}>
          <Pressable
            onPress={() => router.push(`/events/${session.id}` as never)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.primary }}>
              Details
            </Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
          </Pressable>
          {session.starred && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={14} color={Colors.warning} />
              <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: Colors.textSecondary }}>
                Saved
              </Text>
            </View>
          )}
          {!session.starred && onStar && (
            <Pressable onPress={onStar} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} hitSlop={8}>
              <Ionicons name="star-outline" size={14} color={Colors.textSecondary} />
              <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: Colors.textSecondary }}>
                Save
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
