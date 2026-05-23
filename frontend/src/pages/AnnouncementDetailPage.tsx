import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, Tag, User as UserIcon, Share2 } from 'lucide-react';
import client from '../api/client';
import { Post } from '../types';

const AnnouncementDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const handleShare = () => {
    if (!post) return;
    const url = `${window.location.origin}/announcements/${id}`;
    if (navigator.share) {
      navigator
        .share({
          title: post.title || 'ARDD update',
          text: post.content,
          url,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert('Update link copied to clipboard!');
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await client.get<Post>(`/posts/${id}`);
        setPost(response.data);
      } catch (error) {
        console.error('Error fetching announcement:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading)
    return (
      <main className="min-h-screen bg-canvas pt-20 text-center text-foreground-secondary">
        Loading update…
      </main>
    );
  if (!post)
    return (
      <main className="min-h-screen bg-canvas pt-20 text-center text-foreground-secondary">
        Update not found.
      </main>
    );

  return (
    <main className="min-h-screen bg-canvas pt-10 pb-12 text-foreground-primary">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground-secondary transition hover:text-accent"
        >
          <ArrowLeft size={16} />
          Back to Updates
        </button>

        <article>
          <header className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">
                <Tag size={11} />
                {post.category}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-foreground-tertiary">
                <Clock size={13} />
                {new Date(post.created_at).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h1 className="text-3xl font-bold leading-tight text-foreground-primary sm:text-4xl">
              {post.title || 'Official update'}
            </h1>

            <div className="mt-6 flex items-center gap-3 border-y border-border-secondary py-4">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-surface-muted ring-2 ring-canvas">
                {post.author?.profile_photo_url ? (
                  <img
                    src={post.author.profile_photo_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-accent-soft text-accent">
                    <UserIcon size={16} />
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-tertiary">
                  Published by
                </p>
                <p className="font-bold text-foreground-primary">{post.username}</p>
              </div>
            </div>
          </header>

          <div className="space-y-6">
            <p className="whitespace-pre-wrap text-lg leading-relaxed text-foreground-secondary">
              {post.content}
            </p>

            {post.media && post.media.length > 0 && (
              <div className="mt-8 grid gap-4">
                {post.media.map((item, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-lg border border-border-secondary bg-surface shadow-sm"
                  >
                    {item.type === 'video' ? (
                      <video src={item.url} controls className="w-full" />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.altText || ''}
                        className="w-full object-cover"
                      />
                    )}
                    {item.altText && (
                      <p className="p-3 text-center text-sm italic text-foreground-tertiary">
                        {item.altText}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <footer className="mt-12 border-t border-border-secondary pt-8 text-center">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-md border border-border-secondary bg-surface px-5 py-2.5 text-sm font-bold text-foreground-secondary transition hover:border-border-primary hover:text-foreground-primary"
            >
              <Share2 size={16} />
              Share this update
            </button>
          </footer>
        </article>
      </div>
    </main>
  );
};

export default AnnouncementDetailPage;
