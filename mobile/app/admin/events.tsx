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
import type { Event } from '@/store/types';

type EventForm = {
  id?: number;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'current' | 'past';
  image_url: string;
};

const emptyForm: EventForm = {
  title: '',
  description: '',
  location: '',
  start_date: '',
  end_date: '',
  status: 'draft',
  image_url: '',
};

const statuses: EventForm['status'][] = ['draft', 'current', 'past'];

const toInputDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
};

const formatEventDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export default function AdminEventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EventForm>(emptyForm);

  const fetchEvents = useCallback(async () => {
    if (!user?.is_superuser) return;
    try {
      const data = await apiClient.get<Event[]>('/events/admin');
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Could not load events', error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.is_superuser]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormVisible(true);
  };

  const openEdit = (event: Event) => {
    setForm({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      start_date: toInputDate(event.start_date),
      end_date: toInputDate(event.end_date),
      status: event.status,
      image_url: event.image_url || '',
    });
    setFormVisible(true);
  };

  const saveEvent = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.location.trim() || !form.start_date || !form.end_date) {
      Alert.alert('Missing fields', 'Title, description, location, start date, and end date are required.');
      return;
    }

    const startDate = new Date(form.start_date);
    const endDate = new Date(form.end_date);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      Alert.alert('Invalid dates', 'Use a date format like 2026-08-25T09:00.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: form.status,
        image_url: form.image_url.trim() || null,
      };

      if (form.id) {
        await apiClient.put<Event>(`/events/${form.id}`, payload);
      } else {
        await apiClient.post<Event>('/events/', payload);
      }
      setFormVisible(false);
      await fetchEvents();
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = (eventId: number) => {
    Alert.alert('Delete event?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete<void>(`/events/${eventId}`);
            setEvents((current) => current.filter((event) => event.id !== eventId));
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
        <AuthPrompt message="Sign in as an administrator to manage events." />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents(); }} tintColor={Colors.primary} />}
      >
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: Colors.textPrimary }}>Admin</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 26, color: Colors.textPrimary }}>Manage events</Text>
            <Text style={{ marginTop: 3, fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>
              Create, edit, publish, or delete platform events.
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
          <LoadingState message="Loading events..." />
        ) : events.length === 0 ? (
          <View style={{ backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 24 }}>
            <Text style={{ textAlign: 'center', fontFamily: Fonts.regular, color: Colors.textSecondary }}>No events found.</Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.id} style={{ backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary }}>{event.title}</Text>
                  <Text numberOfLines={2} style={{ marginTop: 4, fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 }}>
                    {event.location}
                  </Text>
                  <Text style={{ marginTop: 4, fontFamily: Fonts.regular, fontSize: 12, color: Colors.textTertiary }}>
                    {formatEventDate(event.start_date)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={() => openEdit(event)} hitSlop={8}>
                    <Ionicons name="create-outline" size={20} color={Colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => deleteEvent(event.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </Pressable>
                </View>
              </View>
              <Text style={{ alignSelf: 'flex-start', fontFamily: Fonts.medium, fontSize: 11, color: Colors.primary, backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                {event.status}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={formVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFormVisible(false)}>
        <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 22, color: Colors.textPrimary }}>{form.id ? 'Edit event' : 'Create event'}</Text>
            <Pressable onPress={() => setFormVisible(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </Pressable>
          </View>

          <AdminInput label="Title" value={form.title} onChangeText={(title) => setForm((current) => ({ ...current, title }))} />
          <AdminInput label="Description" value={form.description} onChangeText={(description) => setForm((current) => ({ ...current, description }))} multiline />
          <AdminInput label="Location" value={form.location} onChangeText={(location) => setForm((current) => ({ ...current, location }))} />
          <AdminInput label="Start date/time" value={form.start_date} onChangeText={(start_date) => setForm((current) => ({ ...current, start_date }))} placeholder="2026-08-25T09:00" />
          <AdminInput label="End date/time" value={form.end_date} onChangeText={(end_date) => setForm((current) => ({ ...current, end_date }))} placeholder="2026-08-25T10:00" />
          <AdminInput label="Image URL" value={form.image_url} onChangeText={(image_url) => setForm((current) => ({ ...current, image_url }))} />
          <ChoiceRow label="Status" values={statuses} selected={form.status} onSelect={(status) => setForm((current) => ({ ...current, status }))} />

          <Pressable
            onPress={saveEvent}
            disabled={saving}
            style={{ backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
          >
            <Text style={{ fontFamily: Fonts.semiBold, color: Colors.white }}>{saving ? 'Saving...' : 'Save event'}</Text>
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
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        autoCapitalize="sentences"
        style={{
          minHeight: multiline ? 120 : 48,
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
  values: EventForm['status'][];
  selected: EventForm['status'];
  onSelect: (value: EventForm['status']) => void;
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
