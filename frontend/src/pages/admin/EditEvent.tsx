import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, MapPin, AlignLeft, Image as ImageIcon } from 'lucide-react';
import client from '../../api/client';
import { Event } from '../../types';

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    image_url: '',
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await client.get<Event>(`/events/${id}`);
        const event = response.data;
        setFormData({
          title: event.title,
          description: event.description,
          location: event.location,
          start_date: new Date(event.start_date).toISOString().slice(0, 16),
          end_date: new Date(event.end_date).toISOString().slice(0, 16),
          status: event.status,
          image_url: event.image_url || '',
        });
      } catch (error) {
        console.error('Error fetching event:', error);
        alert('Failed to load event data.');
        navigate('/admin/events');
      } finally {
        setFetching(false);
      }
    };
    fetchEvent();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };
      await client.put(`/events/${id}`, payload);
      navigate('/admin/events');
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="pt-20 text-center">Loading...</div>;

  return (
    <main className="min-h-screen bg-[#f7f9ff] pt-20 pb-12">
      <div className="mx-auto max-w-2xl px-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft size={16} />
          Back to Events
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Edit Event</h1>
          <p className="text-zinc-600">Update the details of your event.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          {/* Same form fields as CreateEvent */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <AlignLeft size={16} />
              Event Title
            </label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none transition-all focus:border-[#012585] focus:ring-2 focus:ring-[#012585]/5"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <AlignLeft size={16} />
              Description
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none transition-all focus:border-[#012585] focus:ring-2 focus:ring-[#012585]/5"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <MapPin size={16} />
              Location
            </label>
            <input
              required
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none transition-all focus:border-[#012585] focus:ring-2 focus:ring-[#012585]/5"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                <Calendar size={16} />
                Start Date & Time
              </label>
              <input
                required
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none transition-all focus:border-[#012585] focus:ring-2 focus:ring-[#012585]/5"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                <Calendar size={16} />
                End Date & Time
              </label>
              <input
                required
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none transition-all focus:border-[#012585] focus:ring-2 focus:ring-[#012585]/5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <ImageIcon size={16} />
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none transition-all focus:border-[#012585] focus:ring-2 focus:ring-[#012585]/5"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: (e.target.value as any) })}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none transition-all focus:border-[#012585] focus:ring-2 focus:ring-[#012585]/5"
            >
              <option value="draft">Draft</option>
              <option value="current">Current</option>
              <option value="past">Past</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#012585] py-3 font-semibold text-white shadow-sm transition-colors hover:bg-[#012585]/90 disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Update Event'}
          </button>
        </form>
      </div>
    </main>
  );
};

export default EditEvent;
