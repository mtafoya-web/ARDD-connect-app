import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Badge } from './badge';
import type { Event } from '@/store/types';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const router = useRouter();

  return (
    <View
      style={{
        backgroundColor: Colors.card,
        borderRadius: 12,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
      }}
    >
      {/* Placeholder image area */}
      <View
        style={{
          height: 100,
          backgroundColor: Colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {event.ardd_meta?.sessionType ? (
          <View style={{ position: 'absolute', top: 10, left: 10 }}>
            <Badge label={event.ardd_meta.sessionType} variant="primary" size="sm" />
          </View>
        ) : null}
        <Ionicons name="calendar-outline" size={32} color={Colors.textTertiary} />
      </View>

      <View style={{ padding: 14, gap: 8 }}>
        <Text
          selectable
          style={{
            fontFamily: Fonts.semiBold,
            fontSize: 15,
            color: Colors.textPrimary,
            lineHeight: 20,
          }}
          numberOfLines={2}
        >
          {event.title}
        </Text>

        {event.description ? (
          <Text
            style={{
              fontFamily: Fonts.regular,
              fontSize: 13,
              color: Colors.textSecondary,
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {event.description}
          </Text>
        ) : null}

        <View style={{ borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8, gap: 4, marginTop: 4 }}>
          {event.location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
                {event.location}
              </Text>
            </View>
          ) : null}
          {event.start_date ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
                {new Date(event.start_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          ) : null}
        </View>

        <Pressable
          onPress={() => router.push(`/events/${event.id}` as never)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 4 }}
        >
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.primary }}>
            View details
          </Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}
