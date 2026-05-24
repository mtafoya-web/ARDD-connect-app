import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/store/auth-store';
import { AuthPrompt } from '@/components/auth-prompt';

const tiles = [
  {
    title: 'Events',
    subtitle: 'Create, edit, publish, or remove conference events.',
    icon: 'calendar-outline',
    route: '/admin/events',
  },
  {
    title: 'Posts',
    subtitle: 'Create, edit, archive, publish, or delete official posts.',
    icon: 'document-text-outline',
    route: '/admin/posts',
  },
  {
    title: 'Users',
    subtitle: 'Manage attendee roles, experts, and permissions.',
    icon: 'people-outline',
    route: '/admin/users',
  },
] as const;

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuthStore();

  if (!isLoggedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <AuthPrompt message="Sign in as an administrator to manage ARDD." />
      </View>
    );
  }

  if (!user?.is_superuser) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top + 24, paddingHorizontal: 16 }}>
        <Text style={{ fontFamily: Fonts.bold, fontSize: 22, color: Colors.textPrimary }}>Admin only</Text>
        <Text style={{ marginTop: 8, fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary }}>
          This area is restricted to ARDD administrators.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 16, gap: 16 }}
    >
      <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: Colors.textPrimary }}>Back</Text>
      </Pressable>

      <View style={{ gap: 4 }}>
        <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
          ARDD ADMIN
        </Text>
        <Text style={{ fontFamily: Fonts.bold, fontSize: 28, color: Colors.textPrimary }}>Admin dashboard</Text>
        <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary }}>
          Manage the same platform content available from the web admin console.
        </Text>
      </View>

      {tiles.map((tile) => (
        <Pressable
          key={tile.title}
          onPress={() => router.push(tile.route as never)}
          style={({ pressed }) => ({
            backgroundColor: Colors.card,
            borderRadius: 14,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: Colors.border,
            padding: 18,
            gap: 12,
            opacity: pressed ? 0.82 : 1,
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: Colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={tile.icon} size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.textPrimary }}>{tile.title}</Text>
              <Text style={{ marginTop: 2, fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 }}>
                {tile.subtitle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
