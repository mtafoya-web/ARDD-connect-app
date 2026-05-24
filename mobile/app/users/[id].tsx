import { Alert, View, Text, ScrollView, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Avatar } from '@/components/avatar';
import { Badge } from '@/components/badge';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import type { User } from '@/store/types';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoggedIn, user } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const numericId = Number(id);
      if (!id || id === 'undefined' || !Number.isFinite(numericId)) {
        setError('Invalid user ID');
        setLoading(false);
        return;
      }
      try {
        const data = await apiClient.get<User>(`/users/${numericId}`);
        setProfile(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  useEffect(() => {
    const fetchFollowStatus = async () => {
      const numericId = Number(id);
      if (!isLoggedIn || !Number.isFinite(numericId)) return;
      try {
        const data = await apiClient.get<{ following: boolean }>(`/follows/${numericId}`);
        setIsFollowing(Boolean(data.following));
      } catch {
        setIsFollowing(false);
      }
    };
    fetchFollowStatus();
  }, [id, isLoggedIn]);

  const handleFollow = async () => {
    if (!profile) return;
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;
    try {
      setFollowLoading(true);
      if (isFollowing) {
        await apiClient.delete(`/follows/${numericId}`);
        setIsFollowing(false);
        setProfile((current) => current ? {
          ...current,
          followers_count: Math.max(0, (current.followers_count || 0) - 1),
        } : current);
      } else {
        await apiClient.post(`/follows/${numericId}`);
        setIsFollowing(true);
        setProfile((current) => current ? {
          ...current,
          followers_count: (current.followers_count || 0) + 1,
        } : current);
      }
    } catch (e: unknown) {
      Alert.alert(
        'Follow failed',
        e instanceof Error ? e.message : 'Failed to update follow status',
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = () => {
    if (!isLoggedIn || !profile) {
      router.push('/login');
      return;
    }
    router.push({
      pathname: '/chat/[otherUserId]',
      params: {
        otherUserId: String(profile.id),
        name: profile.full_name || profile.username || 'Chat',
      },
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <LoadingState />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <ErrorState message={error || 'User not found'} onRetry={() => router.back()} />
      </View>
    );
  }

  const isSelf = user?.id === profile.id;

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

      {/* Profile Card */}
      <View
        style={{
          backgroundColor: Colors.card,
          borderRadius: 16,
          borderCurve: 'continuous',
          padding: 20,
          gap: 16,
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <Text
          style={{
            fontFamily: Fonts.semiBold,
            fontSize: 11,
            color: Colors.primary,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          RESEARCH PROFILE
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Avatar name={profile.full_name} size={64} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 22, color: Colors.textPrimary }}>
              {profile.full_name}
            </Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary }}>
              @{profile.username}
            </Text>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: Colors.textPrimary }}>
                <Text style={{ fontFamily: Fonts.bold }}>{profile.followers_count ?? 0}</Text> Followers
              </Text>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: Colors.textPrimary }}>
                <Text style={{ fontFamily: Fonts.bold }}>{profile.following_count ?? 0}</Text> Following
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {!isSelf ? (
            <Pressable
              onPress={handleFollow}
              disabled={followLoading}
              style={{
                flex: 1,
                backgroundColor: isFollowing ? Colors.card : Colors.primary,
                borderWidth: isFollowing ? 1 : 0,
                borderColor: Colors.border,
                borderRadius: 10,
                borderCurve: 'continuous',
                paddingVertical: 10,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
                opacity: followLoading ? 0.55 : 1,
              }}
            >
              <Ionicons
                name={isFollowing ? 'checkmark-outline' : 'person-add-outline'}
                size={16}
                color={isFollowing ? Colors.textPrimary : Colors.white}
              />
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: isFollowing ? Colors.textPrimary : Colors.white }}>
                {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={handleMessage}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 10,
              borderCurve: 'continuous',
              paddingVertical: 10,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Ionicons name="chatbubble-outline" size={16} color={Colors.textPrimary} />
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary }}>
              Message
            </Text>
          </Pressable>
        </View>

        {profile.bio ? (
          <Text selectable style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 }}>
            {profile.bio}
          </Text>
        ) : null}

        {/* Tags */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {profile.role ? <Badge label={profile.role} variant="outline" /> : null}
          {profile.area_of_study ? <Badge label={profile.area_of_study} variant="outline" /> : null}
          {profile.location ? <Badge label={profile.location} variant="primary" /> : null}
        </View>
      </View>

      {/* Details */}
      <View
        style={{
          backgroundColor: Colors.card,
          borderRadius: 12,
          borderCurve: 'continuous',
          padding: 16,
          gap: 10,
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary }}>
          Profile details
        </Text>
        {profile.affiliation ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="business-outline" size={15} color={Colors.textTertiary} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>
              {profile.affiliation}
            </Text>
          </View>
        ) : null}
        {profile.area_of_study ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="flask-outline" size={15} color={Colors.textTertiary} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>
              {profile.area_of_study}
            </Text>
          </View>
        ) : null}
        {profile.location ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="location-outline" size={15} color={Colors.textTertiary} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>
              {profile.location}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Research Interests & Looking For */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.card,
            borderRadius: 12,
            borderCurve: 'continuous',
            padding: 14,
            gap: 8,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="sparkles" size={14} color={Colors.primary} />
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Research Interests
            </Text>
          </View>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 }}>
            {profile.research_interests || 'Not specified'}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.card,
            borderRadius: 12,
            borderCurve: 'continuous',
            padding: 14,
            gap: 8,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="people" size={14} color={Colors.primary} />
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Looking For
            </Text>
          </View>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 }}>
            {profile.looking_for || 'Not specified'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
