import { useEffect, useState } from 'react';
import { Alert, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Avatar } from './avatar';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Badge } from './badge';
import type { User } from '@/store/types';

interface PersonCardProps {
  user: User;
}

export function PersonCard({ user }: PersonCardProps) {
  const router = useRouter();
  const { isLoggedIn, user: currentUser } = useAuthStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const isSelf = currentUser?.id === user.id;

  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!isLoggedIn || isSelf) {
        setIsFollowing(false);
        return;
      }
      try {
        const data = await apiClient.get<{ following: boolean }>(`/follows/${user.id}`);
        setIsFollowing(Boolean(data.following));
      } catch {
        setIsFollowing(false);
      }
    };
    fetchFollowStatus();
  }, [isLoggedIn, isSelf, user.id]);

  const handleFollowToggle = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    if (isSelf || followLoading) return;

    try {
      setFollowLoading(true);
      if (isFollowing) {
        await apiClient.delete(`/follows/${user.id}`);
        setIsFollowing(false);
      } else {
        await apiClient.post(`/follows/${user.id}`);
        setIsFollowing(true);
      }
    } catch (error) {
      Alert.alert(
        'Follow failed',
        error instanceof Error ? error.message : 'Could not update follow status.',
      );
    } finally {
      setFollowLoading(false);
    }
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar name={user.full_name} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.textPrimary }}>
            {user.full_name}
          </Text>
          {user.is_expert ? (
            <View style={{ flexDirection: 'row', marginTop: 2 }}>
              <Badge label="EXPERT" variant="primary" size="sm" />
            </View>
          ) : null}
          {user.affiliation ? (
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
              {user.affiliation}
            </Text>
          ) : null}
        </View>
        <Ionicons name="open-outline" size={16} color={Colors.textTertiary} />
      </View>

      {user.bio ? (
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
      ) : null}

      <View style={{ gap: 4 }}>
        {user.affiliation ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="business-outline" size={13} color={Colors.textTertiary} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
              {user.affiliation}
            </Text>
          </View>
        ) : null}
        {user.area_of_study ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="flask-outline" size={13} color={Colors.textTertiary} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
              {user.area_of_study}
            </Text>
          </View>
        ) : null}
        {user.location ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="location-outline" size={13} color={Colors.textTertiary} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
              {user.location}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, paddingTop: 2 }}>
        {!isSelf ? (
          <Pressable
            onPress={handleFollowToggle}
            disabled={followLoading}
            style={{
              flex: 1,
              minHeight: 38,
              borderRadius: 10,
              borderCurve: 'continuous',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              backgroundColor: isFollowing ? Colors.card : Colors.primary,
              borderWidth: isFollowing ? 1 : 0,
              borderColor: Colors.border,
              opacity: followLoading ? 0.55 : 1,
            }}
          >
            <Ionicons
              name={isFollowing ? 'checkmark-outline' : 'person-add-outline'}
              size={15}
              color={isFollowing ? Colors.textPrimary : Colors.white}
            />
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: isFollowing ? Colors.textPrimary : Colors.white }}>
              {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.push(`/users/${user.id}` as never)}
          style={{
            flex: 1,
            minHeight: 38,
            borderRadius: 10,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: Colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 4,
          }}
        >
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.primary }}>
            View profile
          </Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}
