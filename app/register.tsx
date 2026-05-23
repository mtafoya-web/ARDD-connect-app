import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { InputField } from '@/components/input-field';
import { Button } from '@/components/button';
import type { User } from '@/store/types';

interface RegisterResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.post<RegisterResponse>('/auth/register', {
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password: password,
      });
      setAuth(data.access_token, data.user);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed.');
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
          <View style={{ alignItems: 'center' }}>
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
              JOIN THE COMMUNITY
            </Text>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 26, color: Colors.textPrimary }}>
              Create your account
            </Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary }}>
              Join hundreds of researchers, founders, and scientists at ARDD 2026.
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            <InputField
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Dr. Jane Smith"
              autoCapitalize="words"
            />
            <InputField
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="jane_smith"
              autoCapitalize="none"
            />
            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="jane@university.edu"
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
            title="Create account"
            onPress={handleRegister}
            loading={loading}
            fullWidth
          />

          {/* Login link */}
          <Pressable onPress={() => router.back()} style={{ alignSelf: 'center' }}>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary }}>
              Already have an account?{' '}
              <Text style={{ color: Colors.primary, fontFamily: Fonts.semiBold }}>
                Sign in
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
