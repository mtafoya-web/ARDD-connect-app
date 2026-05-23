import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Post } from '../types';
import { PostCard } from '../components/PostCard';
import { Avatar } from '../components/Avatar';

export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPost();
    fetchReplies();
  }, [id]);

  const fetchPost = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await client.get<Post>(`/posts/${id}`);
      setPost(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    if (!id) return;
    try {
      const response = await client.get<Post[]>(`/posts/${id}/replies`);
      setReplies(response.data);
    } catch (err) {
      console.error('Failed to load replies:', err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !comment.trim()) return;
    if (!user) {
      setError('Please sign in to leave a comment.');
      return;
    }

    try {
      setSubmitting(true);
      await client.post('/posts/', {
        content: comment.trim(),
        parent_id: Number(id),
        post_type: 'reply',
      });
      setComment('');
      await fetchPost();
      await fetchReplies();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas text-foreground-primary">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3 text-sm text-foreground-secondary">
          <Link to="/feed" className="inline-flex items-center gap-2 text-accent hover:text-accent-hover">
            <ArrowLeft size={16} /> Back to feed
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-status-error/25 bg-status-error/10 px-4 py-3 text-sm font-medium text-status-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-border-secondary bg-surface p-6 shadow-sm">
            <div className="h-4 w-32 rounded bg-surface-muted" />
            <div className="mt-3 space-y-3">
              <div className="h-4 w-full rounded bg-surface-muted" />
              <div className="h-4 w-full rounded bg-surface-muted" />
              <div className="h-4 w-4/5 rounded bg-surface-muted" />
            </div>
          </div>
        ) : post ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="space-y-6">
              <PostCard
                post={post}
                onDelete={() => navigate('/feed')}
              />

              <section className="rounded-lg border border-border-secondary bg-surface p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-foreground-tertiary">
                      Comment on this post
                    </p>
                    <p className="text-sm text-foreground-secondary">
                      Replies are public and attached to the original post.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                    {post.replies_count || 0} comments
                  </span>
                </div>

                {user ? (
                  <form onSubmit={handleCommentSubmit} className="space-y-4">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      placeholder="Write your comment..."
                      className="w-full resize-none rounded-lg border border-border-secondary bg-surface-muted px-4 py-3 text-sm leading-6 text-foreground-primary outline-none placeholder:text-foreground-tertiary focus:border-border-focus focus:bg-surface focus:ring-4 focus:ring-accent/15"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !comment.trim()}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-foreground-inverse shadow-sm hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Send size={16} />
                      {submitting ? 'Sending...' : 'Post comment'}
                    </button>
                  </form>
                ) : (
                  <div className="rounded-lg border border-border-secondary bg-surface-muted p-5 text-sm text-foreground-secondary">
                    <p className="mb-3">Sign in to leave a comment on this post.</p>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-foreground-inverse hover:bg-accent-hover"
                    >
                      Sign in to comment
                    </Link>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-border-secondary pb-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-foreground-tertiary">
                      Comments
                    </p>
                    <p className="text-sm text-foreground-secondary">
                      These replies are saved on the post thread.
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground-secondary">
                    {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                  </span>
                </div>

                {replies.length > 0 ? (
                  <div className="space-y-4">
                    {replies.map((reply) => (
                      <PostCard key={reply.id} post={reply} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border-secondary bg-surface p-6 text-center text-foreground-secondary">
                    No comments yet. Be the first to add a thoughtful reply.
                  </div>
                )}
              </section>
            </section>

            <aside className="space-y-4">
              <section className="rounded-lg border border-border-secondary bg-surface p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={post.author?.full_name || post.username}
                    username={post.username}
                    url={post.author?.profile_photo_url}
                    size="lg"
                  />
                  <div>
                    <p className="font-semibold text-foreground-primary">Original post by</p>
                    <p className="text-foreground-secondary">@{post.username}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-2 text-sm text-foreground-secondary">
                  <p>{post.replies_count || 0} comments</p>
                  <p>{post.reposts_count || 0} reposts</p>
                  <p>{post.likes_count || 0} likes</p>
                </div>
              </section>
            </aside>
          </div>
        ) : (
          <div className="rounded-lg border border-border-secondary bg-surface p-6 shadow-sm text-foreground-secondary">
            Post not found.
          </div>
        )}
      </div>
    </main>
  );
};
