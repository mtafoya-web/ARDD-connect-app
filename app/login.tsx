import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { InputField } from '@/components/input-field';
import { Button } from '@/components/button';
import type { User } from '@/store/types';

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

const DEMO_USERS = [
  { username: 'maya_chen', label: 'Dr. Maya Chen', subtitle: 'Stanford · computational aging' },
  { username: 'alex_vargas', label: 'Alex Vargas', subtitle: 'ReprogramBio · seed founder' },
  { username: 'sam_okafor', label: 'Sam Okafor', subtitle: 'Long Run Capital · VC' },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (loginUsername?: string) => {
    const uname = loginUsername || username.trim();
    const pass = password || 'password';
    if (!uname) {
      setError('Please enter a username or email');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.post<LoginResponse>(
        '/auth/login',
        { username: uname, password: pass },
        true
      );
      setAuth(data.access_token, data.user);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.background }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            backgroundColor: Colors.card,
            borderRadius: 20,
            borderCurve: 'continuous',
            padding: 28,
            gap: 24,
            maxWidth: 420,
            width: '100%',
            alignSelf: 'center',
            boxShadow: '0 8px 30px rgba(15, 25, 51, 0.08)',
          }}
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Image
              source={require('@/assets/images/ardd_app_icon.png')}
              style={{ width: 56, height: 56, borderRadius: 12 }}
              contentFit="cover"
            />
          </View>

          {/* Title */}
          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontFamily: Fonts.semiBold,
                fontSize: 11,
                color: Colors.primary,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
              }}
            >
              WELCOME BACK
            </Text>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 26, color: Colors.textPrimary }}>
              Sign in to ARDD Connect
            </Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 }}>
              Your personalized companion for ARDD 2026 and Boston Longevity Week.
            </Text>
          </View>

          {/* Demo users */}
          <View
            style={{
              backgroundColor: Colors.primaryLight,
              borderRadius: 12,
              borderCurve: 'continuous',
              padding: 14,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="sparkles" size={13} color={Colors.primary} />
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                JUDGES · ENTER AS A SEEDED DEMO ATTENDEE
              </Text>
            </View>
            {DEMO_USERS.map((demo) => (
              <Pressable
                key={demo.username}
                onPress={() => handleLogin(demo.username)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: pressed ? Colors.white : 'transparent',
                  borderRadius: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.border,
                })}
              >
                <View>
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary }}>
                    {demo.label}
                  </Text>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
                    {demo.subtitle}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
              </Pressable>
            ))}
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            <InputField
              label="Username or email"
              value={username}
              onChangeText={setUsername}
              placeholder=""
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder=""
              secureTextEntry
            />
          </View>

          {error && (
            <Text
              selectable
              style={{
                fontFamily: Fonts.regular,
                fontSize: 13,
                color: Colors.error,
                textAlign: 'center',
              }}
            >
              {error}
            </Text>
          )}

          <Button
            title="Sign in"
            onPress={() => handleLogin()}
            loading={loading}
            fullWidth
            icon={<Ionicons name="log-in-outline" size={18} color={Colors.white} />}
          />

          {/* Register link */}
          <Pressable onPress={() => router.push('/register')} style={{ alignSelf: 'center' }}>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary }}>
              New here?{' '}
              <Text style={{ color: Colors.primary, fontFamily: Fonts.semiBold }}>
                Join the community →
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
