import { View, Text, ScrollView, TextInput, Pressable, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { PostCard } from '@/components/post-card';
import { Avatar } from '@/components/avatar';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import type { Post } from '@/store/types';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPostText, setNewPostText] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      const data = await apiClient.get<Post[]>('/posts/global');
      setPosts(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handlePost = async () => {
    if (!newPostText.trim() || posting) return;
    setPosting(true);
    try {
      await apiClient.post('/posts', { body: newPostText.trim() });
      setNewPostText('');
      fetchPosts();
    } catch {
      // Silent fail for post creation
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await apiClient.post(`/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1 }
            : p
        )
      );
    } catch {
      // Silent
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 26, color: Colors.textPrimary }}>
            Community Feed
          </Text>
        </View>
        {posts.length > 0 && (
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>
            {posts.length} posts
          </Text>
        )}
      </View>

      {/* Create Post */}
      {isLoggedIn && user && (
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="create-outline" size={18} color={Colors.textSecondary} />
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.textPrimary }}>
              Create Post
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Avatar name={user.full_name} size={34} />
            <TextInput
              value={newPostText}
              onChangeText={setNewPostText}
              placeholder="What's on your mind?"
              placeholderTextColor={Colors.textTertiary}
              multiline
              style={{
                flex: 1,
                fontFamily: Fonts.regular,
                fontSize: 14,
                color: Colors.textPrimary,
                minHeight: 60,
                textAlignVertical: 'top',
                padding: 10,
                backgroundColor: Colors.inputBg,
                borderRadius: 8,
                borderCurve: 'continuous',
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Pressable
              onPress={handlePost}
              disabled={!newPostText.trim() || posting}
              style={({ pressed }) => ({
                backgroundColor: Colors.primary,
                borderRadius: 8,
                borderCurve: 'continuous',
                paddingVertical: 8,
                paddingHorizontal: 18,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                opacity: (!newPostText.trim() || posting) ? 0.5 : pressed ? 0.85 : 1,
              })}
            >
              <Ionicons name="send" size={14} color={Colors.white} />
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.white }}>
                Post
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Focus Areas */}
      <View
        style={{
          backgroundColor: Colors.card,
          borderRadius: 12,
          borderCurve: 'continuous',
          padding: 14,
          gap: 10,
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary }}>
          Focus areas
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['Longevity therapeutics', 'Biomarkers', 'Senescence', 'AI discovery'].map((tag) => (
            <View
              key={tag}
              style={{
                backgroundColor: Colors.inputBg,
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: Colors.textSecondary }}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Posts */}
      {loading ? (
        <LoadingState message="Loading posts..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPosts} />
      ) : posts.length === 0 ? (
        <View style={{ alignItems: 'center', padding: 40, gap: 12 }}>
          <Ionicons name="newspaper-outline" size={48} color={Colors.textTertiary} />
          <Text style={{ fontFamily: Fonts.medium, fontSize: 15, color: Colors.textSecondary }}>
            No posts yet
          </Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textTertiary, textAlign: 'center' }}>
            Be the first to share something with the community.
          </Text>
        </View>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={() => handleLike(post.id)}
            showDelete={post.author.id === user?.id}
          />
        ))
      )}
    </ScrollView>
  );
}
