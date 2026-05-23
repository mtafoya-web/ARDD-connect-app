import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Calendar, MapPin, Clock } from 'lucide-react';
import client from '../../api/client';
import { Event } from '../../types';

const ManageEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await client.get<Event[]>('/events/admin');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await client.delete(`/events/${id}`);
      setEvents(events.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  if (loading) {
    return <div className="pt-20 text-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-[#f7f9ff] pt-20 pb-12">
      <div className="mx-auto max-w-page px-4">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Manage Events</h1>
            <p className="text-zinc-600">Create, edit, and organize platform events.</p>
          </div>
          <Link
            to="/admin/events/new"
            className="flex items-center gap-2 rounded-xl bg-[#012585] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#012585]/90"
          >
            <Plus size={18} />
            Create Event
          </Link>
        </header>

        <div className="grid gap-6">
          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
              <Calendar className="mx-auto mb-4 text-zinc-400" size={48} />
              <p className="text-zinc-500">No events found. Create your first event!</p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div className="flex gap-6">
                  <div className="h-24 w-24 overflow-hidden rounded-xl bg-zinc-100">
                    {event.image_url ? (
                      <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-400">
                        <Calendar size={32} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-3">
                      <h3 className="text-xl font-bold text-zinc-900">{event.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                        event.status === 'current' ? 'bg-green-100 text-green-700' :
                        event.status === 'past' ? 'bg-zinc-100 text-zinc-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(event.start_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/admin/events/edit/${event.id}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-[#012585]"
                  >
                    <Edit2 size={18} />
                  </Link>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default ManageEvents;
