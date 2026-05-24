import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { InputField } from '@/components/input-field';
import { Button } from '@/components/button';
import type { User } from '@/store/types';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();

  // Local state names track UI labels; we map to backend field names
  // (affiliation, area_of_study) at the payload boundary below.
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [institution, setInstitution] = useState(user?.affiliation ?? '');
  const [role, setRole] = useState(user?.role ?? '');
  const [researchFocus, setResearchFocus] = useState(user?.area_of_study ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [website, setWebsite] = useState(user?.website ?? '');
  const [researchInterests, setResearchInterests] = useState(user?.research_interests ?? '');
  const [lookingFor, setLookingFor] = useState(user?.looking_for ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Backend route is PUT /users/me with the canonical field names
      // accepted by UserUpdate. Username is intentionally excluded because
      // the backend does not support changing it on this endpoint.
      const updated = await apiClient.put<User>('/users/me', {
        full_name: fullName.trim(),
        bio: bio.trim(),
        affiliation: institution.trim(),
        role: role.trim(),
        area_of_study: researchFocus.trim(),
        location: location.trim(),
        website: website.trim(),
        research_interests: researchInterests.trim(),
        looking_for: lookingFor.trim(),
      });
      setUser(updated);
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.background }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 16, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: Colors.textPrimary }}>
              Cancel
            </Text>
          </Pressable>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.textPrimary }}>
            Edit Profile
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Form */}
        <View
          style={{
            backgroundColor: Colors.card,
            borderRadius: 16,
            borderCurve: 'continuous',
            padding: 20,
            gap: 18,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <InputField label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
          <InputField label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={3} autoCapitalize="sentences" />
          <InputField label="Institution" value={institution} onChangeText={setInstitution} autoCapitalize="words" />
          <InputField label="Role" value={role} onChangeText={setRole} autoCapitalize="words" />
          <InputField label="Research focus" value={researchFocus} onChangeText={setResearchFocus} autoCapitalize="sentences" />
          <InputField label="Location" value={location} onChangeText={setLocation} autoCapitalize="words" />
          <InputField label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" keyboardType="url" />
          <InputField label="Research interests" value={researchInterests} onChangeText={setResearchInterests} multiline numberOfLines={3} autoCapitalize="sentences" />
          <InputField label="Looking for" value={lookingFor} onChangeText={setLookingFor} multiline numberOfLines={3} autoCapitalize="sentences" />
        </View>

        {error ? (
          <Text selectable style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.error, textAlign: 'center' }}>
            {error}
          </Text>
        ) : null}

        <Button title="Save changes" onPress={handleSave} loading={saving} fullWidth />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
