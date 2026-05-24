import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { API_BASE_URL } from '@/constants/Config';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Avatar } from './avatar';
import { Badge } from './badge';
import type { Post } from '@/store/types';

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
  onDeleted?: (postId: number) => void;
  showDelete?: boolean;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const getErrorMessage = (fallback: string, error: unknown) =>
  error instanceof Error ? error.message : fallback;

export function PostCard({ post: initialPost, onDelete, onDeleted, showDelete }: PostCardProps) {
  const { isLoggedIn, user } = useAuthStore();
  const [post, setPost] = useState(initialPost);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [replies, setReplies] = useState<Post[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  const requireAuth = (action: string) => {
    if (isLoggedIn) return true;
    Alert.alert('Sign in required', `Please sign in to ${action}.`);
    return false;
  };

  const fetchReplies = async () => {
    try {
      setLoadingReplies(true);
      const data = await apiClient.get<Post[]>(`/posts/${post.id}/replies`);
      setReplies(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Comments unavailable', getErrorMessage('Failed to load comments.', error));
    } finally {
      setLoadingReplies(false);
    }
  };

  const openComments = () => {
    setCommentsVisible(true);
    fetchReplies();
  };

  const handleLike = async () => {
    if (!requireAuth('like posts')) return;
    try {
      const result = await apiClient.post<{ liked: boolean }>(`/posts/${post.id}/like`);
      setPost((current) => ({
        ...current,
        liked_by_me: result.liked,
        likes_count: result.liked
          ? (current.likes_count || 0) + 1
          : Math.max(0, (current.likes_count || 0) - 1),
      }));
    } catch (error) {
      Alert.alert('Like failed', getErrorMessage('Could not update like.', error));
    }
  };

  const handleBookmark = async () => {
    if (!requireAuth('save posts')) return;
    try {
      const result = await apiClient.post<{ bookmarked: boolean }>(`/posts/${post.id}/bookmark`);
      setPost((current) => ({
        ...current,
        bookmarked_by_me: result.bookmarked,
        bookmarks_count: result.bookmarked
          ? (current.bookmarks_count || 0) + 1
          : Math.max(0, (current.bookmarks_count || 0) - 1),
      }));
    } catch (error) {
      Alert.alert('Save failed', getErrorMessage('Could not save this post.', error));
    }
  };

  const handleRepost = async () => {
    if (!requireAuth('repost')) return;
    try {
      await apiClient.post<Post>(`/posts/${post.id}/repost`);
      setPost((current) => {
        const nextReposted = !current.reposted_by_me;
        return {
          ...current,
          reposted_by_me: nextReposted,
          reposts_count: nextReposted
            ? (current.reposts_count || 0) + 1
            : Math.max(0, (current.reposts_count || 0) - 1),
        };
      });
    } catch (error) {
      Alert.alert('Repost failed', getErrorMessage('Could not repost this post.', error));
    }
  };

  const handleShare = async () => {
    try {
      const url = `${API_BASE_URL}/posts/${post.id}`;
      await Share.share({
        title: post.title || 'ARDD Post',
        message: `${post.title ? `${post.title}\n\n` : ''}${post.content}\n\n${url}`,
        url,
      });
    } catch (error) {
      Alert.alert('Share failed', getErrorMessage('Could not open the share sheet.', error));
    }
  };

  const handleCommentSubmit = async () => {
    if (!requireAuth('comment')) return;
    if (!commentDraft.trim() || submittingReply) return;

    try {
      setSubmittingReply(true);
      await apiClient.post<Post>('/posts/', {
        content: commentDraft.trim(),
        parent_id: post.id,
        post_type: 'reply',
      });
      setCommentDraft('');
      await fetchReplies();
      setPost((current) => ({
        ...current,
        replies_count: (current.replies_count || 0) + 1,
      }));
    } catch (error) {
      Alert.alert('Comment failed', getErrorMessage('Could not post your comment.', error));
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = () => {
    if (!showDelete) return;
    Alert.alert('Delete post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete<void>(`/posts/${post.id}`);
            onDelete?.();
            onDeleted?.(post.id);
          } catch (error) {
            Alert.alert('Delete failed', getErrorMessage('Could not delete this post.', error));
          }
        },
      },
    ]);
  };

  const author = post.author ?? post.user;
  const authorName = author?.full_name || post.username || 'ARDD member';
  const handle = author?.username || post.username;

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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Avatar name={authorName} size={38} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary }}>
              {authorName}
            </Text>
            {handle ? (
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
                @{handle}
              </Text>
            ) : null}
          </View>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textTertiary }}>
            {timeAgo(post.created_at)}
          </Text>
        </View>
        {showDelete && (onDelete || onDeleted || user?.id === post.user_id || user?.is_superuser) ? (
          <Pressable onPress={handleDelete} hitSlop={8}>
            <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: Colors.error }}>
              Delete
            </Text>
          </Pressable>
        ) : null}
      </View>

      {post.category === 'announcement' ? (
        <View style={{ flexDirection: 'row' }}>
          <Badge label="OFFICIAL" variant="primary" size="sm" />
        </View>
      ) : post.post_type && post.post_type !== 'original' ? (
        <Badge label={post.post_type} variant="primary" size="sm" />
      ) : null}

      {post.post_type === 'repost' && post.repost_of ? (
        <View style={{ backgroundColor: Colors.inputBg, borderRadius: 10, padding: 10, gap: 6 }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.primary }}>
            Reposted from @{post.repost_of.username}
          </Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }} numberOfLines={3}>
            {post.repost_of.content}
          </Text>
        </View>
      ) : null}

      {post.title ? (
        <Text selectable style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.textPrimary }}>
          {post.title}
        </Text>
      ) : null}
      <Text
        selectable
        style={{
          fontFamily: Fonts.regular,
          fontSize: 14,
          color: Colors.textSecondary,
          lineHeight: 20,
        }}
      >
        {post.content}
      </Text>

      {post.media?.length ? (
        <View style={{ gap: 8 }}>
          {post.media.map((item, index) => (
            <View
              key={`${item.url}-${index}`}
              style={{ overflow: 'hidden', borderRadius: 10, borderWidth: 1, borderColor: Colors.border }}
            >
              {item.type === 'image' ? (
                <Image source={{ uri: item.url }} style={{ width: '100%', height: 220 }} contentFit="cover" />
              ) : (
                <Text selectable style={{ padding: 12, color: Colors.primary, fontFamily: Fonts.medium, fontSize: 13 }}>
                  Video attachment: {item.url}
                </Text>
              )}
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
        <Pressable onPress={handleLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} hitSlop={8}>
          <Ionicons
            name={post.liked_by_me ? 'heart' : 'heart-outline'}
            size={18}
            color={post.liked_by_me ? Colors.heart : Colors.textSecondary}
          />
          <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, fontVariant: ['tabular-nums'] }}>
            {post.likes_count || 0}
          </Text>
        </Pressable>
        <Pressable onPress={openComments} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={16} color={Colors.textSecondary} />
          <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, fontVariant: ['tabular-nums'] }}>
            {post.replies_count || 0}
          </Text>
        </Pressable>
        <Pressable onPress={handleBookmark} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} hitSlop={8}>
          <Ionicons
            name={post.bookmarked_by_me ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={post.bookmarked_by_me ? Colors.primary : Colors.textSecondary}
          />
          <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, fontVariant: ['tabular-nums'] }}>
            {post.bookmarks_count || 0}
          </Text>
        </Pressable>
        <Pressable onPress={handleRepost} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} hitSlop={8}>
          <Ionicons
            name="repeat-outline"
            size={16}
            color={post.reposted_by_me ? Colors.primary : Colors.textSecondary}
          />
          <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, fontVariant: ['tabular-nums'] }}>
            {post.reposts_count || 0}
          </Text>
        </Pressable>
        <Pressable onPress={handleShare} hitSlop={8}>
          <Ionicons name="share-outline" size={16} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <Modal visible={commentsVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCommentsVisible(false)}>
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <View
            style={{
              backgroundColor: Colors.card,
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
              paddingHorizontal: 16,
              paddingTop: 18,
              paddingBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.textPrimary }}>Comments</Text>
            <Pressable onPress={() => setCommentsVisible(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            <View style={{ backgroundColor: Colors.card, borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary }}>{authorName}</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 13, lineHeight: 19, color: Colors.textSecondary }}>{post.content}</Text>
            </View>

            <View style={{ backgroundColor: Colors.card, borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: Colors.border }}>
              <TextInput
                value={commentDraft}
                onChangeText={setCommentDraft}
                placeholder="Write a public reply"
                placeholderTextColor={Colors.textTertiary}
                multiline
                style={{
                  minHeight: 86,
                  textAlignVertical: 'top',
                  fontFamily: Fonts.regular,
                  fontSize: 14,
                  lineHeight: 20,
                  color: Colors.textPrimary,
                  backgroundColor: Colors.inputBg,
                  borderRadius: 10,
                  padding: 12,
                }}
              />
              <Pressable
                onPress={handleCommentSubmit}
                disabled={submittingReply || !commentDraft.trim()}
                style={({ pressed }) => ({
                  alignSelf: 'flex-end',
                  backgroundColor: Colors.primary,
                  borderRadius: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  opacity: submittingReply || !commentDraft.trim() ? 0.5 : pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.white }}>
                  {submittingReply ? 'Posting...' : 'Add comment'}
                </Text>
              </Pressable>
            </View>

            {loadingReplies ? (
              <ActivityIndicator color={Colors.primary} />
            ) : replies.length ? (
              replies.map((reply) => {
                const replyAuthor = reply.author ?? reply.user;
                const replyName = replyAuthor?.full_name || reply.username || 'ARDD member';
                return (
                  <View key={reply.id} style={{ backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border }}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Avatar name={replyName} size={34} />
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary }}>{replyName}</Text>
                        <Text style={{ fontFamily: Fonts.regular, fontSize: 13, lineHeight: 19, color: Colors.textSecondary }}>
                          {reply.content}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={{ backgroundColor: Colors.card, borderRadius: 12, padding: 18, borderWidth: 1, borderColor: Colors.border }}>
                <Text style={{ textAlign: 'center', fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>
                  No comments yet.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
