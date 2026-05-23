import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Type, AlignLeft, Tag } from 'lucide-react';
import client from '../../api/client';
import { Post, MediaItem } from '../../types';
import MediaUploader from '../../components/MediaUploader';

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'announcement',
    status: 'draft',
    media: [] as MediaItem[],
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await client.get<Post>(`/posts/${id}`);
        const post = response.data;
        setFormData({
          title: post.title || '',
          content: post.content,
          category: post.category,
          status: post.status,
          media: post.media || [],
        });
      } catch (error) {
        console.error('Error fetching post:', error);
        alert('Failed to load post.');
        navigate('/admin/posts');
      } finally {
        setFetching(false);
      }
    };
    fetchPost();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.put(`/posts/${id}`, formData);
      navigate('/admin/posts');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post.');
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
          Back to Posts
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Edit Post</h1>
          <p className="text-zinc-600">Update your official post or announcement.</p>
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
                onChange={(e) => setFormData({ ...formData, status: (e.target.value as any) })}
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
            {loading ? 'Saving...' : 'Update Post'}
          </button>
        </form>
      </div>
    </main>
  );
};

export default EditPost;
