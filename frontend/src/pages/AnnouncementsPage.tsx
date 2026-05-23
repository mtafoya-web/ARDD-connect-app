import { useState, useEffect } from 'react';
import { FileText, User as UserIcon, Clock, ArrowRight, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { Post } from '../types';

const AnnouncementsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await client.get<Post[]>('/posts/global');
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <main className="min-h-screen bg-canvas pt-10 pb-12 text-foreground-primary">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <header className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-accent">
            Organizer Updates
          </p>
          <h1 className="text-3xl font-bold text-foreground-primary sm:text-4xl">
            Official ARDD updates
          </h1>
          <p className="mt-3 max-w-2xl text-foreground-secondary">
            Schedule changes, organizer announcements, and end-of-day digests from the ARDD 2026 team.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-primary bg-surface p-16 text-center">
            <FileText className="mx-auto mb-4 text-foreground-tertiary" size={56} />
            <h3 className="text-lg font-bold text-foreground-primary">No updates yet</h3>
            <p className="text-foreground-secondary">Stay tuned for official ARDD updates.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/announcements/${post.id}`}
                className="group relative flex flex-col gap-5 overflow-hidden rounded-lg border border-border-secondary bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-border-primary hover:shadow-md sm:flex-row sm:p-6"
              >
                <div className="flex flex-1 flex-col">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">
                      <Tag size={11} />
                      {post.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-foreground-tertiary">
                      <Clock size={12} />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="mb-2 text-xl font-bold text-foreground-primary transition group-hover:text-accent sm:text-2xl">
                    {post.title || 'Official update'}
                  </h2>

                  <p className="mb-5 line-clamp-2 flex-1 leading-relaxed text-foreground-secondary">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between border-t border-border-secondary pt-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground-secondary">
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-surface-muted">
                        {post.author?.profile_photo_url ? (
                          <img
                            src={post.author.profile_photo_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-accent-soft text-accent">
                            <UserIcon size={14} />
                          </div>
                        )}
                      </div>
                      {post.username}
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-sm font-bold text-accent">
                      Read
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </div>
                </div>

                {post.media && post.media.length > 0 && (
                  <div className="h-40 w-full shrink-0 overflow-hidden rounded-md border border-border-secondary bg-surface-muted sm:h-auto sm:w-56">
                    {post.media[0].type === 'video' ? (
                      <video src={post.media[0].url} className="h-full w-full object-cover" />
                    ) : (
                      <img
                        src={post.media[0].url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default AnnouncementsPage;
