import { View, Text, Pressable } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './avatar';
import { Badge } from './badge';
import type { Post } from '@/store/types';

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onBookmark?: () => void;
  onDelete?: () => void;
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

export function PostCard({ post, onLike, onBookmark, onDelete, showDelete }: PostCardProps) {
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
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Avatar name={post.author.full_name} size={38} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary }}>
              {post.author.full_name}
            </Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
              @{post.author.username}
            </Text>
          </View>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textTertiary }}>
            {timeAgo(post.created_at)}
          </Text>
        </View>
        {showDelete && onDelete && (
          <Pressable onPress={onDelete} hitSlop={8}>
            <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: Colors.primary }}>
              Delete
            </Text>
          </Pressable>
        )}
      </View>

      {/* Post type badge */}
      {post.post_type ? (
        <Badge label={post.post_type} variant="primary" size="sm" />
      ) : null}

      {/* Content */}
      {post.title ? (
        <Text
          selectable
          style={{
            fontFamily: Fonts.semiBold,
            fontSize: 15,
            color: Colors.textPrimary,
          }}
        >
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
        {post.body}
      </Text>

      {/* Actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, paddingTop: 4 }}>
        <Pressable
          onPress={onLike}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          hitSlop={8}
        >
          <Ionicons
            name={post.is_liked ? 'heart' : 'heart-outline'}
            size={18}
            color={post.is_liked ? Colors.heart : Colors.textSecondary}
          />
          <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, fontVariant: ['tabular-nums'] }}>
            {post.likes_count}
          </Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="chatbubble-outline" size={16} color={Colors.textSecondary} />
          <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, fontVariant: ['tabular-nums'] }}>
            {post.comments_count}
          </Text>
        </View>
        <Pressable
          onPress={onBookmark}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          hitSlop={8}
        >
          <Ionicons
            name={post.is_bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={post.is_bookmarked ? Colors.primary : Colors.textSecondary}
          />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="repeat-outline" size={16} color={Colors.textSecondary} />
          <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, fontVariant: ['tabular-nums'] }}>
            {post.reposts_count}
          </Text>
        </View>
        <Ionicons name="share-outline" size={16} color={Colors.textSecondary} />
      </View>
    </View>
  );
}
