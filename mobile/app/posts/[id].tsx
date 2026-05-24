import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { apiClient } from '@/lib/api-client';
import { PostCard } from '@/components/post-card';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import type { Post } from '@/store/types';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      const numericId = Number(id);
      if (!id || !Number.isFinite(numericId)) {
        setError('Invalid post ID');
        setLoading(false);
        return;
      }
      try {
        const data = await apiClient.get<Post>(`/posts/${numericId}`);
        setPost(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <LoadingState message="Loading post..." />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <ErrorState message={error || 'Post not found'} onRetry={() => router.back()} />
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
      <Text style={{ fontFamily: Fonts.bold, fontSize: 24, color: Colors.textPrimary }}>Post</Text>
      <PostCard post={post} />
    </ScrollView>
  );
}
