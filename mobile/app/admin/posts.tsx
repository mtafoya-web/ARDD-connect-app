import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { AuthPrompt } from '@/components/auth-prompt';
import { LoadingState } from '@/components/loading-state';
import type { Post } from '@/store/types';

type PostForm = {
  id?: number;
  title: string;
  content: string;
  category: string;
  status: string;
};

const emptyForm: PostForm = {
  title: '',
  content: '',
  category: 'announcement',
  status: 'draft',
};

const categories = ['announcement', 'update', 'event-related', 'general'];
const statuses = ['draft', 'published', 'archived'];

export default function AdminPostsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PostForm>(emptyForm);

  const fetchPosts = useCallback(async () => {
    if (!user?.is_superuser) return;
    try {
      const data = await apiClient.get<Post[]>('/posts/admin');
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Could not load posts', error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.is_superuser]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormVisible(true);
  };

  const openEdit = (post: Post) => {
    setForm({
      id: post.id,
      title: post.title || '',
      content: post.content,
      category: post.category || 'announcement',
      status: post.status || 'draft',
    });
    setFormVisible(true);
  };

  const savePost = async () => {
    if (!form.content.trim()) {
      Alert.alert('Content required', 'Post content cannot be empty.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        status: form.status,
        media: [],
      };
      if (form.id) {
        await apiClient.put<Post>(`/posts/${form.id}`, payload);
      } else {
        await apiClient.post<Post>('/posts/', payload);
      }
      setFormVisible(false);
      await fetchPosts();
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setSaving(false);
    }
  };

  const deletePost = (postId: number) => {
    Alert.alert('Delete post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete<void>(`/posts/${postId}`);
            setPosts((current) => current.filter((post) => post.id !== postId));
          } catch (error) {
            Alert.alert('Delete failed', error instanceof Error ? error.message : 'Request failed.');
          }
        },
      },
    ]);
  };

  if (!isLoggedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <AuthPrompt message="Sign in as an administrator to manage posts." />
      </View>
    );
  }

  if (!user?.is_superuser) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top + 24, paddingHorizontal: 16 }}>
        <Text style={{ fontFamily: Fonts.bold, fontSize: 22, color: Colors.textPrimary }}>Admin only</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 16, gap: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} tintColor={Colors.primary} />}
      >
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: Colors.textPrimary }}>Admin</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 26, color: Colors.textPrimary }}>Manage posts</Text>
            <Text style={{ marginTop: 3, fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>
              Create and manage official announcements and posts.
            </Text>
          </View>
          <Pressable
            onPress={openCreate}
            style={{ backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', gap: 6 }}
          >
            <Ionicons name="add" size={16} color={Colors.white} />
            <Text style={{ fontFamily: Fonts.semiBold, color: Colors.white, fontSize: 13 }}>New</Text>
          </Pressable>
        </View>

        {loading ? (
          <LoadingState message="Loading posts..." />
        ) : posts.length === 0 ? (
          <View style={{ backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 24 }}>
            <Text style={{ textAlign: 'center', fontFamily: Fonts.regular, color: Colors.textSecondary }}>No posts found.</Text>
          </View>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={{ backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary }}>
                    {post.title || 'Untitled post'}
                  </Text>
                  <Text numberOfLines={2} style={{ marginTop: 4, fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 }}>
                    {post.content}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={() => openEdit(post)} hitSlop={8}>
                    <Ionicons name="create-outline" size={20} color={Colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => deletePost(post.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </Pressable>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: Colors.primary, backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                  {post.status}
                </Text>
                <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: Colors.textSecondary, backgroundColor: Colors.inputBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                  {post.category}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={formVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFormVisible(false)}>
        <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 22, color: Colors.textPrimary }}>{form.id ? 'Edit post' : 'Create post'}</Text>
            <Pressable onPress={() => setFormVisible(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </Pressable>
          </View>

          <AdminInput label="Title" value={form.title} onChangeText={(title) => setForm((current) => ({ ...current, title }))} />
          <AdminInput label="Content" value={form.content} onChangeText={(content) => setForm((current) => ({ ...current, content }))} multiline />
          <ChoiceRow label="Category" values={categories} selected={form.category} onSelect={(category) => setForm((current) => ({ ...current, category }))} />
          <ChoiceRow label="Status" values={statuses} selected={form.status} onSelect={(status) => setForm((current) => ({ ...current, status }))} />

          <Pressable
            onPress={savePost}
            disabled={saving}
            style={{ backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
          >
            <Text style={{ fontFamily: Fonts.semiBold, color: Colors.white }}>{saving ? 'Saving...' : 'Save post'}</Text>
          </Pressable>
        </ScrollView>
      </Modal>
    </View>
  );
}

function AdminInput({
  label,
  value,
  onChangeText,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{
          minHeight: multiline ? 140 : 48,
          borderWidth: 1,
          borderColor: Colors.inputBorder,
          backgroundColor: Colors.card,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontFamily: Fonts.regular,
          color: Colors.textPrimary,
        }}
      />
    </View>
  );
}

function ChoiceRow({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {values.map((value) => {
          const active = selected === value;
          return (
            <Pressable
              key={value}
              onPress={() => onSelect(value)}
              style={{
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: active ? Colors.primary : Colors.card,
                borderWidth: 1,
                borderColor: active ? Colors.primary : Colors.border,
              }}
            >
              <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: active ? Colors.white : Colors.textSecondary }}>
                {value}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
