import { View, Text, ScrollView, TextInput, Pressable, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { API_BASE_URL } from '@/constants/Config';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { PostCard } from '@/components/post-card';
import { Avatar } from '@/components/avatar';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { SegmentedControl } from '@/components/segmented-control';
import type { Post } from '@/store/types';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostText, setNewPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [postCategory, setCategory] = useState<'general' | 'announcement'>('general');

  const isAuthorized = user?.is_superuser || user?.ardd_meta?.can_post_announcements;

  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      const url = activeTab === 1 ? '/posts/global?category=announcement' : '/posts/global';
      const data = await apiClient.get<any>(url);
      setPosts(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchPosts();
  }, [fetchPosts]);

  // TEMPORARY: Health check diagnostic test
  useEffect(() => {
    const healthUrl = `${API_BASE_URL}/health`;
    console.log('[HealthCheck] API_BASE_URL:', JSON.stringify(API_BASE_URL));
    console.log('[HealthCheck] Full URL:', healthUrl);

    if (!API_BASE_URL || !API_BASE_URL.startsWith('http')) {
      console.error(
        '[HealthCheck] Skipping fetch — API_BASE_URL is invalid:',
        JSON.stringify(API_BASE_URL)
      );
      return;
    }

    fetch(healthUrl)
      .then(async (res) => {
        const body = await res.text();
        console.log('[HealthCheck] Status:', res.status, 'Body:', body);
      })
      .catch((err: unknown) => {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[HealthCheck] Fetch error message:', error.message);
        console.error('[HealthCheck] Fetch error toString:', error.toString());
        console.error('[HealthCheck] Fetch error stack:', error.stack);
      });
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handlePost = async () => {
    if (!newPostText.trim() || posting) return;
    setPosting(true);
    try {
      // Backend route is POST /posts/ (trailing slash) and expects `content`,
      // not `/posts` with `body`. The old form would 307-redirect AND 422.
      await apiClient.post('/posts/', { 
        title: newPostTitle.trim(),
        content: newPostText.trim(),
        category: postCategory
      });
      setNewPostTitle('');
      setNewPostText('');
      setCategory('general');
      fetchPosts();
    } catch {
      // Silent fail for post creation
    } finally {
      setPosting(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={{ gap: 12 }}>
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

        <SegmentedControl
          tabs={['All Posts', 'Official Updates']}
          activeIndex={activeTab}
          onTabPress={setActiveTab}
          icons={[
            <Ionicons name="people" size={14} color={activeTab === 0 ? Colors.white : Colors.textSecondary} />,
            <Ionicons name="megaphone" size={14} color={activeTab === 1 ? Colors.white : Colors.textSecondary} />
          ]}
        />
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
            <View style={{ flex: 1, gap: 10 }}>
              <TextInput
                value={newPostTitle}
                onChangeText={setNewPostTitle}
                placeholder="Add a title (optional)"
                placeholderTextColor={Colors.textTertiary}
                style={{
                  fontFamily: Fonts.semiBold,
                  fontSize: 16,
                  color: Colors.textPrimary,
                  padding: 10,
                  backgroundColor: Colors.inputBg,
                  borderRadius: 8,
                  borderCurve: 'continuous',
                }}
              />
              <TextInput
                value={newPostText}
                onChangeText={setNewPostText}
                placeholder="What's on your mind?"
                placeholderTextColor={Colors.textTertiary}
                multiline
                style={{
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
          </View>

          {isAuthorized && (
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.textSecondary }}>
                Post Category
              </Text>
              <SegmentedControl
                tabs={['General', 'Official']}
                activeIndex={postCategory === 'general' ? 0 : 1}
                onTabPress={(idx) => setCategory(idx === 0 ? 'general' : 'announcement')}
              />
            </View>
          )}

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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary }}>
            Focus areas
          </Text>
          <Pressable onPress={() => router.push('/people')}>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: Colors.primary }}>
              View all
            </Text>
          </Pressable>
        </View>
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
          <Ionicons 
            name={activeTab === 1 ? "megaphone-outline" : "newspaper-outline"} 
            size={48} 
            color={Colors.textTertiary} 
          />
          <Text style={{ fontFamily: Fonts.medium, fontSize: 15, color: Colors.textSecondary }}>
            {activeTab === 1 ? "No official updates yet" : "No posts yet"}
          </Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textTertiary, textAlign: 'center' }}>
            {activeTab === 1 
              ? "Stay tuned for important announcements from the ARDD team."
              : "Be the first to share something with the community."
            }
          </Text>
        </View>
      ) : (
        (Array.isArray(posts) ? posts : []).map((post) => (
          <PostCard
            key={post.id}
            post={post}
            showDelete={post.author?.id === user?.id}
            onDeleted={(postId) => setPosts((current) => current.filter((item) => item.id !== postId))}
          />
        ))
      )}
    </ScrollView>
  );
}
