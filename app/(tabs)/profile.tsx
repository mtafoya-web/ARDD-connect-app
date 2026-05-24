import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Avatar } from '@/components/avatar';
import { Badge } from '@/components/badge';
import { PostCard } from '@/components/post-card';
import { AuthPrompt } from '@/components/auth-prompt';
import { LoadingState } from '@/components/loading-state';
import type { Post } from '@/store/types';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMyPosts = useCallback(async () => {
    if (!isLoggedIn || !user) return;
    setLoading(true);
    try {
      const data = await apiClient.get<any>('/posts/global');
      const safePosts = Array.isArray(data) ? data : [];
      // Filter to only my posts
      setPosts(safePosts.filter((p: any) => p.author?.id === user.id));
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    fetchMyPosts();
  }, [fetchMyPosts]);

  if (!isLoggedIn || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <AuthPrompt message="Sign in to view your profile" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 16, gap: 20 }}
    >
      {/* Profile Header */}
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
          <Avatar name={user.full_name} size={64} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 22, color: Colors.textPrimary }}>
              {user.full_name}
            </Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary }}>
              @{user.username}
            </Text>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: Colors.textPrimary }}>
                <Text style={{ fontFamily: Fonts.bold }}>{user.followers_count ?? 0}</Text> Followers
              </Text>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: Colors.textPrimary }}>
                <Text style={{ fontFamily: Fonts.bold }}>{user.following_count ?? 0}</Text> Following
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/profile/edit')}
          style={{
            backgroundColor: Colors.primary,
            borderRadius: 10,
            borderCurve: 'continuous',
            paddingVertical: 10,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="create-outline" size={16} color={Colors.white} />
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.white }}>
            Edit profile
          </Text>
        </Pressable>

        {user.bio ? (
          <Text selectable style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 }}>
            {user.bio}
          </Text>
        ) : null}

        {/* Tags */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {user.role ? <Badge label={user.role} variant="outline" /> : null}
          {user.research_focus ? <Badge label={user.research_focus} variant="outline" /> : null}
          {user.location ? <Badge label={user.location} variant="primary" /> : null}
        </View>
      </View>

      {/* Profile details */}
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
        {user.email ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="mail-outline" size={15} color={Colors.textTertiary} />
            <Text selectable style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>
              {user.email}
            </Text>
          </View>
        ) : null}
        {user.institution ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="business-outline" size={15} color={Colors.textTertiary} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>
              {user.institution}
            </Text>
          </View>
        ) : null}
        {user.research_focus ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="flask-outline" size={15} color={Colors.textTertiary} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>
              {user.research_focus}
            </Text>
          </View>
        ) : null}
        {user.location ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="location-outline" size={15} color={Colors.textTertiary} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>
              {user.location}
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
            {user.research_interests || 'Not specified'}
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
            {user.looking_for || 'Not specified'}
          </Text>
        </View>
      </View>

      {/* Post history */}
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="document-text-outline" size={16} color={Colors.textPrimary} />
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 16, color: Colors.textPrimary }}>
            Post history
          </Text>
        </View>
        {loading ? (
          <LoadingState message="Loading posts..." />
        ) : posts.length === 0 ? (
          <View
            style={{
              backgroundColor: Colors.card,
              borderRadius: 10,
              padding: 20,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>
              No posts yet
            </Text>
          </View>
        ) : (
          (Array.isArray(posts) ? posts : []).map((post) => <PostCard key={post.id} post={post} showDelete />)
        )}
      </View>

      {/* Logout */}
      <Pressable
        onPress={logout}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 14,
          borderRadius: 10,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: Colors.border,
          marginTop: 8,
        }}
      >
        <Ionicons name="log-out-outline" size={18} color={Colors.textSecondary} />
        <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: Colors.textSecondary }}>
          Sign out
        </Text>
      </Pressable>
    </ScrollView>
  );
}
