import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Type, AlignLeft, Tag } from 'lucide-react';
import client from '../../api/client';
import MediaUploader from '../../components/MediaUploader';
import { MediaItem } from '../../types';

const CreatePost = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'announcement',
    status: 'draft',
    media: [] as MediaItem[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post('/posts/', formData);
      navigate('/admin/posts');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post.');
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
          Back to Posts
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Create New Post</h1>
          <p className="text-zinc-600">Publish an official announcement or update.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <Type size={16} />
              Post Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Exciting Updates for ARRD 2026"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none transition-all focus:border-[#012585] focus:ring-2 focus:ring-[#012585]/5"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <AlignLeft size={16} />
              Content
            </label>
            <textarea
              required
              rows={8}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your post content here..."
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none transition-all focus:border-[#012585] focus:ring-2 focus:ring-[#012585]/5"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                <Tag size={16} />
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none transition-all focus:border-[#012585] focus:ring-2 focus:ring-[#012585]/5"
              >
                <option value="announcement">Announcement</option>
                <option value="update">Update</option>
                <option value="event-related">Event Related</option>
                <option value="general">General</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none transition-all focus:border-[#012585] focus:ring-2 focus:ring-[#012585]/5"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <MediaUploader
            media={formData.media}
            onChange={(media) => setFormData({ ...formData, media })}
          />

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#012585] py-3 font-semibold text-white shadow-sm transition-colors hover:bg-[#012585]/90 disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Creating...' : 'Create Post'}
          </button>
        </form>
      </div>
    </main>
  );
};

export default CreatePost;
