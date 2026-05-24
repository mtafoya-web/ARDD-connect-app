import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { checkExpertProfile, claimExpertByEmail } from '@/lib/experts-api';
import { InputField } from '@/components/input-field';
import { Button } from '@/components/button';
import type { User, Expert } from '@/store/types';

// POST /auth/register returns a UserOut object (not a token)
// After registration, we auto-login to get the token
interface RegisterUserOut {
  id: number;
  username: string;
  email: string;
  phone_number?: string | null;
  full_name: string;
}

interface LoginResponse {
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expertProfile, setExpertProfile] = useState<Expert | null>(null);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [claimingExpert, setClaimingExpert] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Register returns UserOut (no token), then auto-login
      await apiClient.post<RegisterUserOut>('/auth/register', {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        phone_number: phoneNumber.trim() || undefined,
        password: password,
      });
      // Auto-login after successful registration (form-urlencoded with username + password)
      const loginData = await apiClient.post<LoginResponse>(
        '/auth/login',
        { username: username.trim(), password: password },
        true
      );
      setAuth(loginData.access_token, loginData.user);
      const displayName = fullName.trim();
      let updatedUser = loginData.user;
      if (displayName) {
        updatedUser = await apiClient.put<User>('/users/me', {
          full_name: displayName,
        });
        setAuth(loginData.access_token, updatedUser);
      }

      // Check for expert profile
      try {
        const expertCheck = await checkExpertProfile(email.trim().toLowerCase());
        if (expertCheck.has_expert_profile && expertCheck.expert) {
          setExpertProfile(expertCheck.expert);
          setShowExpertModal(true);
        } else {
          router.replace('/(tabs)');
        }
      } catch (err) {
        // If expert check fails, just proceed to feed
        router.replace('/(tabs)');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimExpert = async () => {
    if (!expertProfile) return;
    setClaimingExpert(true);
    try {
      const result = await claimExpertByEmail(email.trim().toLowerCase());
      if (result.success) {
        setShowExpertModal(false);
        router.replace('/(tabs)');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to claim expert profile');
    } finally {
      setClaimingExpert(false);
    }
  };

  const handleSkipExpert = () => {
    setShowExpertModal(false);
    router.replace('/(tabs)');
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
              label="Phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Optional"
              keyboardType="phone-pad"
            />
            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder=""
              secureTextEntry
            />
          </View>

          {error ? (
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
          ) : null}

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

      {/* Expert Profile Modal */}
      <Modal
        visible={showExpertModal}
        transparent
        animationType="fade"
        onRequestClose={handleSkipExpert}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: Colors.card,
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 400,
              gap: 20,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ backgroundColor: Colors.primary + '20', padding: 12, borderRadius: 12 }}>
                  <Ionicons name="ribbon-outline" size={24} color={Colors.primary} />
                </View>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 20, color: Colors.textPrimary }}>
                  Expert Profile Found!
                </Text>
              </View>
              <Pressable onPress={handleSkipExpert}>
                <Ionicons name="close" size={24} color={Colors.textTertiary} />
              </Pressable>
            </View>

            <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary }}>
              We found your profile from the ARDD speakers directory. Would you like to claim it?
            </Text>

            {expertProfile && (
              <View style={{ backgroundColor: Colors.background, borderRadius: 16, padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ backgroundColor: Colors.primary + '20', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="checkmark" size={12} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.textPrimary }}>
                      {expertProfile.csv_name}
                    </Text>
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textTertiary }}>
                      {expertProfile.csv_affiliation}
                    </Text>
                  </View>
                </View>

                <View style={{ borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
                    EXPERTISE
                  </Text>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, marginTop: 4 }}>
                    {expertProfile.csv_field}
                  </Text>
                </View>

                {expertProfile.csv_keywords && (
                  <View style={{ borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 }}>
                    <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
                      KEYWORDS
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {expertProfile.csv_keywords.split(',').map((keyword, i) => (
                        <View
                          key={i}
                          style={{
                            backgroundColor: Colors.primary + '10',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 20,
                          }}
                        >
                          <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: Colors.primary }}>
                            {keyword.trim()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button
                title="Skip for now"
                variant="secondary"
                onPress={handleSkipExpert}
                style={{ flex: 1 }}
              />
              <Button
                title={claimingExpert ? 'Claiming...' : 'Claim profile'}
                onPress={handleClaimExpert}
                loading={claimingExpert}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
