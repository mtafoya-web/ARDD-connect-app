import { View, Text, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { SegmentedControl } from '@/components/segmented-control';
import { PersonCard } from '@/components/person-card';
import { MatchCard } from '@/components/match-card';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { AuthPrompt } from '@/components/auth-prompt';
import type { User, Match } from '@/store/types';

export default function PeopleScreen() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuthStore();
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      if (activeTab === 0) {
        const data = await apiClient.get<User[]>('/users/');
        setUsers(data);
      } else if (isLoggedIn) {
        const data = await apiClient.get<Match[]>('/users/matches');
        setMatches(data);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, isLoggedIn]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.institution?.toLowerCase().includes(q) ?? false)
    );
  });

  const renderContent = () => {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} onRetry={fetchData} />;

    if (activeTab === 0) {
      if (filteredUsers.length === 0) {
        return (
          <View style={{ alignItems: 'center', padding: 40, gap: 12 }}>
            <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
            <Text style={{ fontFamily: Fonts.medium, fontSize: 15, color: Colors.textSecondary }}>
              No attendees found
            </Text>
          </View>
        );
      }
      return (
        <View style={{ gap: 12 }}>
          {filteredUsers.map((u) => (
            <PersonCard key={u.id} user={u} />
          ))}
        </View>
      );
    }

    if (!isLoggedIn) {
      return <AuthPrompt message="Sign in to see your top matches" />;
    }

    if (matches.length === 0) {
      return (
        <View style={{ alignItems: 'center', padding: 40, gap: 12 }}>
          <Ionicons name="sparkles-outline" size={48} color={Colors.textTertiary} />
          <Text style={{ fontFamily: Fonts.medium, fontSize: 15, color: Colors.textSecondary }}>
            No matches yet
          </Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textTertiary, textAlign: 'center' }}>
            Complete your profile to get matched with other attendees.
          </Text>
        </View>
      );
    }
    return (
      <View style={{ gap: 12 }}>
        <View style={{ backgroundColor: Colors.card, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 }}>
            Ranked using your ARDD profile — role, research focus, business goals, availability, and stated session interests.
          </Text>
        </View>
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: Fonts.semiBold,
              fontSize: 11,
              color: Colors.primary,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            ATTENDEES
          </Text>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 26, color: Colors.textPrimary, marginTop: 4 }}>
            Explore the ARDD community
          </Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, marginTop: 4 }}>
            Browse the full ARDD 2026 attendee directory, or jump to your personalized top matches.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
          <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: Colors.textSecondary }}>
            {activeTab === 0 ? `${filteredUsers.length} shown` : `${matches.length} matches`}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <SegmentedControl
        tabs={['Directory', 'Top Matches']}
        activeIndex={activeTab}
        onTabPress={setActiveTab}
      />

      {/* Search (only for directory) */}
      {activeTab === 0 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.card,
            borderRadius: 10,
            borderCurve: 'continuous',
            paddingHorizontal: 14,
            paddingVertical: 10,
            gap: 10,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Ionicons name="search" size={18} color={Colors.textTertiary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, username, or affiliation"
            placeholderTextColor={Colors.textTertiary}
            style={{
              flex: 1,
              fontFamily: Fonts.regular,
              fontSize: 14,
              color: Colors.textPrimary,
            }}
          />
        </View>
      )}

      {renderContent()}
    </ScrollView>
  );
}
