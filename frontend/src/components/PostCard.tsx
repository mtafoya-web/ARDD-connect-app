import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post } from '../types';
import { Bookmark, ChevronLeft, Heart, MessageCircle, Repeat2, Share2, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

interface PostCardProps {
  post: Post;
  onDelete?: (postId: number) => void;
}

export const PostCard = ({ post: initialPost, onDelete }: PostCardProps) => {
  const [post, setPost] = useState(initialPost);
  const author = post.user || post.author;
  const repostSource = post.repost_of;
  const repostAuthor = repostSource?.author;
  const rawHandle = author?.username || post.username || '';
  const handle = rawHandle.trim();
  const displayName = (author?.full_name || handle || 'ARDD member').trim();
  const repostHandle = (repostAuthor?.username || repostSource?.username || '').trim();
  const repostDisplayName = (repostAuthor?.full_name || repostHandle || 'ARDD member').trim();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderRichText = (text: string) => {
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const formatted = escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');

    return { __html: formatted };
  };

  const handleLike = async () => {
    try {
      const response = await client.post<{ liked: boolean }>(`/posts/${post.id}/like`);
      const isLiked = response.data.liked;
      setPost((prev) => ({
        ...prev,
        liked_by_me: isLiked,
        likes_count: isLiked ? (prev.likes_count || 0) + 1 : Math.max(0, (prev.likes_count || 0) - 1),
      }));
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleBookmark = async () => {
    try {
      const response = await client.post<{ bookmarked: boolean }>(`/posts/${post.id}/bookmark`);
      const isBookmarked = response.data.bookmarked;
      setPost((prev) => ({
        ...prev,
        bookmarked_by_me: isBookmarked,
        bookmarks_count: isBookmarked ? (prev.bookmarks_count || 0) + 1 : Math.max(0, (prev.bookmarks_count || 0) - 1),
      }));
    } catch (err) {
      console.error('Failed to bookmark post:', err);
    }
  };

  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [replies, setReplies] = useState<Post[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const canDeleteParent = Boolean(user && (user.id === post.user_id || user.is_superuser));

  const handleRepost = async () => {
    try {
      const response = await client.post<Post>(`/posts/${post.id}/repost`);
      setPost((prev) => ({
        ...prev,
        reposted_by_me: !prev.reposted_by_me,
        reposts_count: !prev.reposted_by_me ? (prev.reposts_count || 0) + 1 : Math.max(0, (prev.reposts_count || 0) - 1),
      }));
    } catch (err) {
      console.error('Failed to repost:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) {
      return;
    }

    try {
      await client.delete(`/posts/${post.id}`);
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Unable to delete this post.');
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!window.confirm('Delete this comment? This cannot be undone.')) {
      return;
    }

    try {
      await client.delete(`/posts/${replyId}`);
      setReplies((prev) => prev.filter((reply) => reply.id !== replyId));
      setPost((prev) => ({
        ...prev,
        replies_count: Math.max(0, (prev.replies_count || 1) - 1),
      }));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert('Unable to delete this comment.');
    }
  };

  const navigate = useNavigate();

  const fetchReplies = async () => {
    try {
      setLoadingComments(true);
      const response = await client.get<Post[]>(`/posts/${post.id}/replies`);
      setReplies(response.data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentDraft.trim()) return;

    try {
      setSubmittingComment(true);
      setCommentError('');
      await client.post('/posts/', {
        content: commentDraft.trim(),
        parent_id: post.id,
        post_type: 'reply',
      });
      setCommentDraft('');
      await fetchReplies();
      setPost((prev) => ({
        ...prev,
        replies_count: (prev.replies_count || 0) + 1,
      }));
    } catch (err: any) {
      setCommentError(err.response?.data?.detail || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const openComments = () => {
    setShowComments(true);
  };

  const closeComments = () => {
    setShowComments(false);
  };

  useEffect(() => {
    if (showComments) {
      fetchReplies();
    }
  }, [showComments]);

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: post.title || 'ARDD Post',
        text: post.content,
        url: url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleReply = () => {
    openComments();
  };

  return (
    <article className="group relative rounded-lg border border-border-secondary bg-surface p-5 shadow-sm hover:border-border-primary hover:shadow-md">
      {canDeleteParent && (
        <button
          onClick={handleDelete}
          className="absolute right-3 top-3 inline-flex h-9 items-center rounded-full border border-border-secondary bg-surface px-3 text-sm text-status-error hover:bg-status-error/10 hover:text-status-error"
          type="button"
        >
          Delete
        </button>
      )}
      <div className="flex gap-4">
        <Avatar name={displayName} username={handle} url={author?.profile_photo_url} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
            <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                to={`/profile/${post.user_id}`}
                className="font-semibold text-foreground-primary hover:text-accent"
              >
                {displayName}
              </Link>
              {handle && <span className="text-sm text-foreground-tertiary">@{handle}</span>}
              {handle && <span className="text-sm text-foreground-tertiary" aria-hidden="true">&middot;</span>}
              <time className="text-sm text-foreground-tertiary" dateTime={post.created_at}>
                {formatDate(post.created_at)}
              </time>
            </div>
            <div className="flex items-center gap-2">
              {post.category && post.category !== 'general' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                  <Tag size={10} />
                  {post.category}
                </span>
              )}
            </div>
          </div>
          
          {post.title && <h3 className="mt-2 text-lg font-bold text-foreground-primary">{post.title}</h3>}

          {post.post_type === 'repost' && (
            <div className="mt-3 rounded-lg border border-border-secondary bg-surface-muted p-3">
              <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent">
                <Repeat2 size={13} />
                Reposted from{' '}
                {repostSource ? (
                  <Link to={`/profile/${repostSource.user_id}`} className="normal-case tracking-normal text-foreground-primary hover:text-accent">
                    {repostDisplayName}
                    {repostHandle ? ` @${repostHandle}` : ''}
                  </Link>
                ) : (
                  <span className="normal-case tracking-normal text-foreground-secondary">original post</span>
                )}
              </div>
              {repostSource && (
                <Link
                  to={`/post/${repostSource.id}`}
                  className="block rounded-md border border-border-secondary bg-surface px-3 py-2 hover:border-border-primary"
                >
                  {repostSource.title && (
                    <p className="mb-1 text-sm font-bold text-foreground-primary">{repostSource.title}</p>
                  )}
                  <p className="line-clamp-3 text-sm leading-6 text-foreground-secondary">
                    {repostSource.content}
                  </p>
                </Link>
              )}
            </div>
          )}

          <p className="mt-2 text-[15px] leading-7 text-foreground-secondary" dangerouslySetInnerHTML={renderRichText(post.content)} />
          
          {post.media && post.media.length > 0 && (
            <div className={`mt-4 grid gap-2 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {post.media.map((item, index) => (
                <div key={index} className="overflow-hidden rounded-xl border border-border-secondary bg-surface-muted">
                  {item.type === 'video' ? (
                    <video src={item.url} controls className="w-full" />
                  ) : (
                    <img src={item.url} alt={item.altText || ''} className="h-full w-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-secondary pt-3 text-foreground-tertiary">
            <button
              onClick={handleLike}
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm hover:bg-surface-muted hover:text-accent-secondary ${post.liked_by_me ? 'text-accent-secondary' : ''}`}
              type="button"
            >
              <Heart size={16} fill={post.liked_by_me ? 'currentColor' : 'none'} />
              <span>{post.likes_count || 0}</span>
            </button>
            <button
              onClick={handleReply}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm hover:bg-surface-muted hover:text-accent"
              type="button"
            >
              <MessageCircle size={16} />
              <span>{post.replies_count || 0}</span>
            </button>
            <button
              onClick={handleBookmark}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-muted hover:text-foreground-primary ${post.bookmarked_by_me ? 'text-accent' : ''}`}
              aria-label="Save post"
              type="button"
            >
              <Bookmark size={16} fill={post.bookmarked_by_me ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleRepost}
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm hover:bg-surface-muted hover:text-accent-secondary ${post.reposted_by_me ? 'text-accent-secondary' : ''}`}
              type="button"
            >
              <Repeat2 size={16} />
              <span>{post.reposts_count || 0}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-muted hover:text-foreground-primary"
              aria-label="Share post"
              type="button"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {showComments && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 py-6 sm:items-center"
          onClick={closeComments}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border-secondary bg-surface shadow-xl sm:max-h-[90vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border-secondary px-4 py-4 sm:px-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-foreground-tertiary">Comments</p>
                <p className="text-sm text-foreground-secondary">Replies on this post are shown here without leaving the feed.</p>
              </div>
              <button
                onClick={closeComments}
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-secondary bg-surface text-foreground-primary transition hover:bg-surface-muted"
                aria-label="Close comments"
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
              <div className="rounded-3xl border border-border-secondary bg-surface-muted p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={displayName} username={handle} url={author?.profile_photo_url} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground-primary">{displayName}</span>
                      {handle && <span className="text-sm text-foreground-tertiary">@{handle}</span>}
                    </div>
                    {post.title && <p className="mt-2 text-sm font-semibold text-foreground-primary">{post.title}</p>}
                    <p className="mt-2 text-sm leading-6 text-foreground-secondary whitespace-pre-wrap">{post.content}</p>
                  </div>
                </div>
              </div>

              {commentError && (
                <div className="rounded-lg border border-status-error/25 bg-status-error/10 px-4 py-3 text-sm text-status-error">
                  {commentError}
                </div>
              )}

              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <textarea
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  rows={4}
                  placeholder="Write a public reply to this post"
                  className="w-full resize-none rounded-3xl border border-border-secondary bg-surface px-4 py-3 text-sm leading-6 text-foreground-primary outline-none placeholder:text-foreground-tertiary focus:border-border-focus focus:bg-surface focus:ring-4 focus:ring-accent/15"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-foreground-secondary">Comments stay on the thread, not in the feed.</span>
                  <button
                    type="submit"
                    disabled={submittingComment || !commentDraft.trim()}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-foreground-inverse shadow-sm hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {submittingComment ? 'Posting…' : 'Add comment'}
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {loadingComments ? (
                  <div className="space-y-3">
                    <div className="h-4 w-3/5 rounded bg-surface-muted" />
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-surface-muted" />
                      <div className="h-3 w-4/5 rounded bg-surface-muted" />
                    </div>
                  </div>
                ) : replies.length > 0 ? (
                  replies.map((reply) => (
                    <article key={reply.id} className="relative rounded-3xl border border-border-secondary bg-surface p-4">
                      {(user?.id === reply.user_id || user?.is_superuser) && (
                        <button
                          onClick={() => handleDeleteReply(reply.id)}
                          type="button"
                          className="absolute right-3 top-3 inline-flex h-9 items-center rounded-full border border-border-secondary bg-surface px-3 text-sm text-status-error hover:bg-status-error/10 hover:text-status-error"
                        >
                          Delete
                        </button>
                      )}
                      <div className="flex items-start gap-3">
                        <Avatar
                          name={reply.user?.full_name || reply.author?.full_name || reply.username}
                          username={reply.username}
                          url={reply.user?.profile_photo_url || reply.author?.profile_photo_url}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-sm text-foreground-tertiary">
                            <span className="font-semibold text-foreground-primary">{reply.user?.full_name || reply.author?.full_name || reply.username}</span>
                            {reply.username && <span>@{reply.username}</span>}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-foreground-secondary" dangerouslySetInnerHTML={renderRichText(reply.content)} />
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-3xl border border-border-secondary bg-surface p-6 text-center text-foreground-secondary">
                    No comments yet. Open the thread to start the discussion.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
