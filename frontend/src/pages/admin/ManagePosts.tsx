import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, FileText, User as UserIcon, Clock } from 'lucide-react';
import client from '../../api/client';
import { Post } from '../../types';

const ManagePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await client.get<Post[]>('/posts/admin');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await client.delete(`/posts/${id}`);
      setPosts(posts.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting post:', error);
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
            <h1 className="text-3xl font-bold text-zinc-900">Manage Posts</h1>
            <p className="text-zinc-600">Create and manage official announcements and posts.</p>
          </div>
          <Link
            to="/admin/posts/new"
            className="flex items-center gap-2 rounded-xl bg-[#012585] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#012585]/90"
          >
            <Plus size={18} />
            Create Post
          </Link>
        </header>

        <div className="grid gap-6">
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
              <FileText className="mx-auto mb-4 text-zinc-400" size={48} />
              <p className="text-zinc-500">No posts found. Create your first official post!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <h3 className="text-xl font-bold text-zinc-900">{post.title || 'Untitled Post'}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                      post.status === 'published' ? 'bg-green-100 text-green-700' :
                      post.status === 'archived' ? 'bg-zinc-100 text-zinc-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {post.status}
                    </span>
                    <span className="rounded-full bg-[#012585]/[0.05] px-2 py-0.5 text-xs font-semibold text-[#012585] capitalize">
                      {post.category}
                    </span>
                  </div>
                  <p className="mb-3 line-clamp-1 text-zinc-600">{post.content}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                    <div className="flex items-center gap-1">
                      <UserIcon size={14} />
                      {post.username}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="ml-6 flex gap-2">
                  <Link
                    to={`/admin/posts/edit/${post.id}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-[#012585]"
                  >
                    <Edit2 size={18} />
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
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

export default ManagePosts;
