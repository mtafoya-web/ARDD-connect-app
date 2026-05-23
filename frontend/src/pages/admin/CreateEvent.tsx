import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, MapPin, AlignLeft, Image as ImageIcon } from 'lucide-react';
import client from '../../api/client';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    image_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Ensure dates are in ISO format for the backend
      const payload = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };
      await client.post('/events/', payload);
      navigate('/admin/events');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-zinc-900">Create New Event</h1>
          <p className="text-zinc-600">Fill in the details to announce a new event.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
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
              placeholder="e.g. ARRD Annual Connect 2026"
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
              placeholder="Tell people what the event is about..."
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
              placeholder="e.g. New York, NY or Online"
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
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none transition-all focus:border-[#012585] focus:ring-2 focus:ring-[#012585]/5"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>
    </main>
  );
};

export default CreateEvent;
