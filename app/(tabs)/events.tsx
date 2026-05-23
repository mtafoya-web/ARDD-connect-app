import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { SegmentedControl } from '@/components/segmented-control';
import { EventCard } from '@/components/event-card';
import { SessionCard } from '@/components/session-card';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { AuthPrompt } from '@/components/auth-prompt';
import type { Event, Session } from '@/store/types';

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuthStore();
  const [activeTab, setActiveTab] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [recommended, setRecommended] = useState<Session[]>([]);
  const [mySchedule, setMySchedule] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      if (activeTab === 0) {
        const data = await apiClient.get<Event[]>('/events/?status=current');
        setEvents(data);
      } else if (activeTab === 1 && isLoggedIn) {
        const data = await apiClient.get<Session[]>('/sessions/recommended');
        setRecommended(data);
      } else if (activeTab === 2 && isLoggedIn) {
        const data = await apiClient.get<Session[]>('/sessions/my');
        setMySchedule(data);
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

  const handleStar = async (sessionId: number) => {
    try {
      await apiClient.post(`/sessions/${sessionId}/star`);
      // Optimistic update
      const updateList = (list: Session[]) =>
        list.map((s) => (s.id === sessionId ? { ...s, is_starred: true } : s));
      setRecommended(updateList);
      setMySchedule(updateList);
    } catch {
      // Silent
    }
  };

  const renderContent = () => {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} onRetry={fetchData} />;

    if (activeTab === 0) {
      if (events.length === 0) {
        return (
          <View style={{ alignItems: 'center', padding: 40, gap: 12 }}>
            <Text style={{ fontFamily: Fonts.medium, fontSize: 15, color: Colors.textSecondary }}>
              No events found
            </Text>
          </View>
        );
      }
      return (
        <View style={{ gap: 16 }}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>
      );
    }

    if (!isLoggedIn) {
      return <AuthPrompt message="Sign in to view personalized recommendations" />;
    }

    if (activeTab === 1) {
      if (recommended.length === 0) {
        return (
          <View style={{ alignItems: 'center', padding: 40, gap: 12 }}>
            <Text style={{ fontFamily: Fonts.medium, fontSize: 15, color: Colors.textSecondary }}>
              No recommendations yet
            </Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textTertiary, textAlign: 'center' }}>
              Complete your profile to get personalized session recommendations.
            </Text>
          </View>
        );
      }
      return (
        <View style={{ gap: 12 }}>
          <View style={{ backgroundColor: Colors.card, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 }}>
              {"Ranked using your ARDD profile — research focus, role, conference goals, and the sessions you've already starred."}
            </Text>
          </View>
          {recommended.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              showMatchScore
              showReasons
              onStar={() => handleStar(session.id)}
            />
          ))}
        </View>
      );
    }

    if (mySchedule.length === 0) {
      return (
        <View style={{ alignItems: 'center', padding: 40, gap: 12 }}>
          <Text style={{ fontFamily: Fonts.medium, fontSize: 15, color: Colors.textSecondary }}>
            No saved sessions
          </Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textTertiary, textAlign: 'center' }}>
            Star sessions to build your personal schedule.
          </Text>
        </View>
      );
    }
    return (
      <View style={{ gap: 12 }}>
        {mySchedule.map((session) => (
          <SessionCard key={session.id} session={session} onStar={() => handleStar(session.id)} />
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
      <View>
        <Text
          style={{
            fontFamily: Fonts.semiBold,
            fontSize: 11,
            color: Colors.primary,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          ARDD 2026 · BOSTON LONGEVITY WEEK
        </Text>
        <Text style={{ fontFamily: Fonts.bold, fontSize: 26, color: Colors.textPrimary, marginTop: 4 }}>
          Program & Schedule
        </Text>
        <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, marginTop: 4 }}>
          {"Browse the full program, drill into your personalized recommendations, or open the schedule you've curated."}
        </Text>
      </View>

      {/* Tabs */}
      <SegmentedControl
        tabs={['Full Program', 'Recommended', 'My Schedule']}
        activeIndex={activeTab}
        onTabPress={setActiveTab}
      />

      {renderContent()}
    </ScrollView>
  );
}
