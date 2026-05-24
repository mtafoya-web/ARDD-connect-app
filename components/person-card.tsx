import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Avatar } from './avatar';
import type { User } from '@/store/types';

interface PersonCardProps {
  user: User;
}

export function PersonCard({ user }: PersonCardProps) {
  const router = useRouter();

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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar name={user.full_name} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.textPrimary }}>
            {user.full_name}
          </Text>
          {user.institution && (
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
              {user.institution}
            </Text>
          )}
        </View>
        <Ionicons name="open-outline" size={16} color={Colors.textTertiary} />
      </View>

      {user.bio && (
        <Text
          style={{
            fontFamily: Fonts.regular,
            fontSize: 13,
            color: Colors.textSecondary,
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {user.bio}
        </Text>
      )}

      <View style={{ gap: 4 }}>
        {user.institution && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="business-outline" size={13} color={Colors.textTertiary} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
              {user.institution}
            </Text>
          </View>
        )}
        {user.research_focus && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="flask-outline" size={13} color={Colors.textTertiary} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
              {user.research_focus}
            </Text>
          </View>
        )}
        {user.location && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="location-outline" size={13} color={Colors.textTertiary} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
              {user.location}
            </Text>
          </View>
        )}
      </View>

      <Pressable
        onPress={() => router.push(`/users/${user.id}` as never)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 2 }}
      >
        <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.primary }}>
          View profile
        </Text>
        <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
      </Pressable>
    </View>
  );
}
