import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Avatar } from '@/components/avatar';
import { Badge } from '@/components/badge';
import { AuthPrompt } from '@/components/auth-prompt';
import type { User } from '@/store/types';

export default function AdminUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: currentUser, isLoggedIn } = useAuthStore();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!currentUser?.is_superuser) return;
    try {
      const data = await apiClient.get<User[]>('/users/', { params: { q: search } });
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Search failed', error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser?.is_superuser, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = async (userId: number, role: string, isSuperuser: boolean) => {
    try {
      setUpdating(userId);
      await apiClient.put(`/users/${userId}/admin`, {
        role,
        is_superuser: isSuperuser
      });
      fetchUsers();
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Failed to update user.');
    } finally {
      setUpdating(null);
    }
  };

  const toggleAnnouncementPermission = async (targetUser: User) => {
    try {
      setUpdating(targetUser.id);
      const newMeta = {
        ...(targetUser.ardd_meta || {}),
        can_post_announcements: !(targetUser.ardd_meta?.can_post_announcements)
      };
      await apiClient.put(`/users/${targetUser.id}/admin`, {
        ardd_meta: newMeta
      });
      fetchUsers();
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Failed to update permissions.');
    } finally {
      setUpdating(null);
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <AuthPrompt message="Sign in as an administrator to manage users." />
      </View>
    );
  }

  if (!currentUser?.is_superuser) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top + 24, paddingHorizontal: 16 }}>
        <Text style={{ fontFamily: Fonts.bold, fontSize: 22, color: Colors.textPrimary }}>Admin only</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: Colors.textPrimary }}>Admin</Text>
        </Pressable>

        <Text style={{ fontFamily: Fonts.bold, fontSize: 26, color: Colors.textPrimary }}>Manage Users</Text>
        
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: Colors.inputBg, 
          borderRadius: 12, 
          paddingHorizontal: 12,
          height: 44 
        }}>
          <Ionicons name="search" size={18} color={Colors.textTertiary} />
          <TextInput
            placeholder="Search attendees..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, marginLeft: 8, fontFamily: Fonts.regular, fontSize: 14, color: Colors.textPrimary }}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => { setRefreshing(true); fetchUsers(); }} 
              tintColor={Colors.primary} 
            />
          }
          renderItem={({ item }) => (
            <View style={{ 
              backgroundColor: Colors.card, 
              borderRadius: 14, 
              borderWidth: 1, 
              borderColor: Colors.border, 
              padding: 16,
              gap: 12
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar name={item.full_name} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary }}>
                    {item.full_name || item.username}
                  </Text>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>
                    {item.email}
                  </Text>
                </View>
                <Pressable 
                  onPress={() => {
                    if (item.id === currentUser?.id) return;
                    Alert.alert(
                      'Change Role',
                      `Select a new role for ${item.full_name || item.username}`,
                      [
                        { text: 'User', onPress: () => updateUserRole(item.id, 'user', false) },
                        { text: 'Expert', onPress: () => updateUserRole(item.id, 'expert', false) },
                        { text: 'Admin', onPress: () => updateUserRole(item.id, 'admin', true) },
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                  disabled={updating === item.id || item.id === currentUser?.id}
                  style={{ gap: 4, alignItems: 'flex-end' }}
                >
                  <Badge 
                    label={item.is_superuser ? 'ADMIN' : (item.role || 'USER').toUpperCase()} 
                    variant={item.is_superuser ? 'primary' : 'outline'}
                    size="sm"
                  />
                  {item.is_expert && (
                    <Badge label="EXPERT" variant="secondary" size="sm" />
                  )}
                </Pressable>
              </View>

              <View style={{ height: 1, backgroundColor: Colors.border }} />

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Pressable
                  onPress={() => toggleAnnouncementPermission(item)}
                  disabled={updating === item.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: item.ardd_meta?.can_post_announcements ? Colors.primaryLight : Colors.inputBg,
                  }}
                >
                  <Ionicons 
                    name={item.ardd_meta?.can_post_announcements ? "checkmark-circle" : "close-circle-outline"} 
                    size={16} 
                    color={item.ardd_meta?.can_post_announcements ? Colors.primary : Colors.textTertiary} 
                  />
                  <Text style={{ 
                    fontFamily: Fonts.semiBold, 
                    fontSize: 12, 
                    color: item.ardd_meta?.can_post_announcements ? Colors.primary : Colors.textSecondary 
                  }}>
                    Official Posts
                  </Text>
                </Pressable>

                {!item.is_superuser ? (
                  <Pressable
                    onPress={() => updateUserRole(item.id, 'admin', true)}
                    disabled={updating === item.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                      backgroundColor: Colors.inputBg,
                    }}
                  >
                    <Ionicons name="shield-outline" size={16} color={Colors.textSecondary} />
                    <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.textSecondary }}>
                      Make Admin
                    </Text>
                  </Pressable>
                ) : item.id !== currentUser.id && (
                  <Pressable
                    onPress={() => updateUserRole(item.id, 'user', false)}
                    disabled={updating === item.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                      backgroundColor: Colors.inputBg,
                    }}
                  >
                    <Ionicons name="shield-half-outline" size={16} color={Colors.error} />
                    <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.error }}>
                      Revoke Admin
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => router.push(`/users/${item.id}`)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: Colors.inputBg,
                  }}
                >
                  <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.textSecondary }}>
                    Profile
                  </Text>
                </Pressable>
              </View>

              {updating === item.id && (
                <View style={{ 
                  position: 'absolute', 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 14
                }}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ fontFamily: Fonts.regular, color: Colors.textTertiary }}>No users found matching "{search}"</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
