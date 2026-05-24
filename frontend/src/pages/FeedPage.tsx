import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { MediaItem, Post } from '../types';
import { uploadMedia } from '../services/mediaService';
import { PostCard } from '../components/PostCard';
import { Avatar } from '../components/Avatar';
import { Suggestions } from '../components/Suggestions';
import {
  ArrowUpRight,
  BookOpenCheck,
  CalendarDays,
  CircleDot,
  Film,
  FlaskConical,
  Image,
  MapPin,
  Send,
  Smile,
  Sparkles,
  TrendingUp,
  UsersRound,
} from 'lucide-react';

const focusAreas = ['Longevity therapeutics', 'Biomarkers', 'Senescence', 'AI discovery'];

const communityPrompts = [
  'Share a preprint worth reading',
  'Ask for protocol feedback',
  'Find a translational collaborator',
];

const LoadingPost = () => (
  <div className="rounded-lg border border-border-secondary bg-surface p-5 shadow-sm">
    <div className="flex gap-4">
      <div className="h-11 w-11 rounded-full bg-surface-muted" />
      <div className="flex-1 space-y-3">
        <div className="h-4 w-40 rounded bg-surface-muted" />
        <div className="h-3 w-full rounded bg-surface-muted" />
        <div className="h-3 w-4/5 rounded bg-surface-muted" />
      </div>
    </div>
  </div>
);

export const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [locationInputVisible, setLocationInputVisible] = useState(false);
  const [locationDraft, setLocationDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const firstName = (user?.full_name || user?.username || 'there').split(' ')[0];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await client.get<Post[]>('/posts/home');
      setPosts(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const insertFormatting = (wrapper: string) => {
    const textarea = textareaRef.current;
    const value = newPostContent;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || 'text';
    const formatted = `${value.slice(0, start)}${wrapper}${selected}${wrapper}${value.slice(end)}`;

    setNewPostContent(formatted);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorOffset = wrapper.length;
      textarea.setSelectionRange(start + cursorOffset, end + cursorOffset);
    });
  };

  const addEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setNewPostContent((prev) => `${prev}${emoji}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = newPostContent;
    const updated = `${value.slice(0, start)}${emoji}${value.slice(end)}`;

    setNewPostContent(updated);

    requestAnimationFrame(() => {
      textarea.focus();
      const position = start + emoji.length;
      textarea.setSelectionRange(position, position);
    });
  };

  const toggleEmojiPicker = () => {
    setEmojiOpen((value) => !value);
  };

  const handleLocationSave = () => {
    if (!locationDraft.trim()) return;
    setLocation(locationDraft.trim());
    setLocationInputVisible(false);
    setLocationDraft('');
  };

  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      alert('Location access is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`Current location: ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        setLocationInputVisible(false);
        setLocationDraft('');
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          alert('Location access denied. Please allow location permission to pin your current location.');
        } else {
          alert('Unable to determine your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleMediaUpload = async (files: FileList | null, expectedType: 'image' | 'video') => {
    if (!files || files.length === 0) return;

    const uploadedItems: MediaItem[] = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      if (!file.type.startsWith(expectedType)) {
        continue;
      }

      try {
        const result = await uploadMedia(file);
        // expectedType is the caller-provided category ('image' | 'video')
        // we filtered for above; we trust it over the server's resource_type
        // here because the UI groups by category in the composer.
        uploadedItems.push({
          type: expectedType,
          url: result.url,
          publicId: result.public_id,
        });
      } catch (err) {
        console.error('Media upload failed:', err);
        alert(`Failed to upload ${file.name}`);
      }
    }

    if (uploadedItems.length > 0) {
      setNewPostMedia((current) => [...current, ...uploadedItems]);
    }
  };

  const removeMediaItem = (index: number) => {
    setNewPostMedia((current) => current.filter((_, idx) => idx !== index));
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && newPostMedia.length === 0 && !location.trim()) return;

    try {
      setPosting(true);
      await client.post('/posts/', {
        content: location ? `${newPostContent.trim()}

📍 ${location.trim()}` : newPostContent.trim(),
        media: newPostMedia,
      });
      setNewPostContent('');
      setNewPostMedia([]);
      setLocation('');
      setLocationInputVisible(false);
      await fetchPosts();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas text-foreground-primary">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,640px)_320px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <section className="overflow-hidden rounded-lg border border-border-secondary bg-surface shadow-sm">
              <div className="h-20 bg-surface-muted" />
              <div className="px-4 pb-5">
                <Avatar
                  name={user?.full_name}
                  username={user?.username}
                  url={user?.profile_photo_url}
                  size="lg"
                  className="-mt-7 ring-4 ring-surface"
                />
                <h2 className="mt-3 truncate text-lg font-bold text-foreground-primary">
                  {user?.full_name || user?.username || 'Your profile'}
                </h2>
                <p className="text-sm text-foreground-tertiary">@{user?.username}</p>
                <div className="mt-4 space-y-3 text-sm text-foreground-secondary">
                  {user?.affiliation && (
                    <div className="flex items-center gap-2">
                      <FlaskConical size={16} className="text-accent" />
                      <span className="truncate">{user.affiliation}</span>
                    </div>
                  )}
                  {user?.area_of_study && (
                    <div className="flex items-center gap-2">
                      <BookOpenCheck size={16} className="text-accent-secondary" />
                      <span className="truncate">{user.area_of_study}</span>
                    </div>
                  )}
                </div>
                <Link
                  to="/edit-profile"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border-secondary px-4 py-2 text-sm font-semibold text-foreground-primary hover:border-border-primary hover:bg-surface-muted"
                >
                  Refine profile
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </section>

            <section className="rounded-lg border border-border-secondary bg-surface p-4 shadow-sm">
              <h2 className="text-sm font-bold uppercase text-foreground-tertiary">Network</h2>
              <div className="mt-4 space-y-3">
                <Link to="/people" className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-surface-muted">
                  <span className="flex items-center gap-3 text-sm font-semibold text-foreground-primary">
                    <UsersRound size={18} className="text-accent" />
                    Community directory
                  </span>
                  <ArrowUpRight size={16} className="text-foreground-tertiary" />
                </Link>
                <Link to="/feed" className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-surface-muted">
                  <span className="flex items-center gap-3 text-sm font-semibold text-foreground-primary">
                    <TrendingUp size={18} className="text-accent-secondary" />
                    Latest posts
                  </span>
                  <ArrowUpRight size={16} className="text-foreground-tertiary" />
                </Link>
              </div>
            </section>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-accent">Home</p>
              <h1 className="mt-1 text-3xl font-bold text-foreground-primary sm:text-4xl">
                Community feed
              </h1>
            </div>
            <div className="hidden rounded-full border border-border-secondary bg-surface px-3 py-2 text-sm font-semibold text-foreground-secondary sm:flex">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </div>
          </div>

          <form
            onSubmit={handlePostSubmit}
            className="mb-5 rounded-3xl border border-border-secondary bg-surface p-6 shadow-sm"
          >
            <div>
              <h2 className="text-xl font-semibold text-foreground-primary">Create post</h2>
              <p className="mt-1 text-sm text-foreground-secondary">Share an update with your community.</p>
            </div>

            <div className="mt-6 flex items-start gap-4">
              <Avatar name={user?.full_name} username={user?.username} url={user?.profile_photo_url} />
              <div className="min-w-0 flex-1">
                <textarea
                  ref={textareaRef}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={`What's on your mind, ${firstName}?`}
                  className="min-h-[180px] w-full resize-none rounded-3xl border border-border-secondary bg-surface-muted px-5 py-4 text-[15px] leading-7 text-foreground-primary outline-none placeholder:text-foreground-tertiary focus:border-border-focus focus:bg-surface focus:ring-4 focus:ring-accent/15"
                  rows={6}
                />

                <div className="mt-5 rounded-3xl border border-border-secondary bg-surface-muted p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-foreground-primary shadow-sm">
                        <Image size={18} />
                      </span>
                      <span className="text-sm font-semibold text-foreground-primary">Add to your post</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border-secondary bg-white text-foreground-primary hover:bg-surface-muted"
                        aria-label="Add photo"
                      >
                        <Image size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border-secondary bg-white text-foreground-primary hover:bg-surface-muted"
                        aria-label="Add video"
                      >
                        <Film size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={toggleEmojiPicker}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border-secondary bg-white text-foreground-primary hover:bg-surface-muted"
                        aria-label="Add emoji"
                      >
                        <Smile size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLocationInputVisible(true);
                          setLocationDraft(location);
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border-secondary bg-white text-foreground-primary hover:bg-surface-muted"
                        aria-label="Pin location"
                      >
                        <MapPin size={16} />
                      </button>
                    </div>
                  </div>

                  {emojiOpen && (
                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {['😊', '😂', '👍', '❤️', '🔥', '🎉', '💡', '🚀', '😎', '🙌'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => addEmoji(emoji)}
                          className="rounded-2xl border border-border-secondary bg-white px-3 py-2 text-lg hover:bg-surface-muted"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {locationInputVisible && (
                    <div className="mt-4 space-y-3 rounded-3xl border border-border-secondary bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                          value={locationDraft}
                          onChange={(e) => setLocationDraft(e.target.value)}
                          placeholder="Enter a location to pin"
                          className="w-full rounded-2xl border border-border-secondary bg-surface-muted px-4 py-2 text-sm text-foreground-primary outline-none focus:border-border-primary focus:ring-2 focus:ring-accent/20"
                        />
                        <button
                          type="button"
                          onClick={handleLocationSave}
                          className="inline-flex h-10 items-center justify-center rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-foreground-inverse hover:bg-accent-hover"
                        >
                          Save
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={requestLocationPermission}
                          className="inline-flex h-10 items-center justify-center rounded-2xl border border-border-secondary bg-white px-4 py-2 text-sm text-foreground-primary hover:bg-surface-muted"
                        >
                          Use my location
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLocationInputVisible(false);
                            setLocationDraft('');
                          }}
                          className="inline-flex h-10 items-center justify-center rounded-2xl border border-border-secondary bg-white px-4 py-2 text-sm text-foreground-primary hover:bg-surface-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {location && !locationInputVisible && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-foreground-primary shadow-sm">
                      <MapPin size={14} className="text-accent" />
                      <span>{location}</span>
                      <button
                        type="button"
                        onClick={() => setLocation('')}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground-tertiary hover:bg-surface-muted"
                        aria-label="Remove location"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {newPostMedia.length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {newPostMedia.map((item, index) => (
                        <div key={index} className="relative overflow-hidden rounded-3xl border border-border-secondary bg-white">
                          {item.type === 'video' ? (
                            <video src={item.url} controls className="h-40 w-full object-cover" />
                          ) : (
                            <img src={item.url} alt="Attachment preview" className="h-40 w-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => removeMediaItem(index)}
                            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/75"
                            aria-label="Remove attachment"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/*"
                    multiple
                    onChange={(e) => handleMediaUpload(e.target.files, 'image')}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    multiple
                    onChange={(e) => handleMediaUpload(e.target.files, 'video')}
                    className="hidden"
                  />
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="submit"
                    disabled={posting || !newPostContent.trim()}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-foreground-inverse shadow-sm hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Send size={16} />
                    {posting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {error && (
            <div className="mb-4 rounded-lg border border-status-error/25 bg-status-error/10 px-4 py-3 text-sm font-medium text-status-error">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <LoadingPost />
              <LoadingPost />
              <LoadingPost />
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-primary bg-surface p-10 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-accent">
                <UsersRound size={22} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-foreground-primary">Your community feed is ready</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-foreground-secondary">
                Follow ARDD community members to bring collaboration asks and conference-relevant discussions into this space.
              </p>
              <Link
                to="/people"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-foreground-inverse hover:bg-accent-hover"
              >
                Explore community
                <ArrowUpRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={(deletedPostId) =>
                    setPosts((current) => current.filter((item) => item.id !== deletedPostId))
                  }
                />
              ))}
            </div>
          )}
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <Suggestions />
            
            <section className="rounded-lg border border-border-secondary bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-foreground-primary">Focus areas</h2>
                <CircleDot size={18} className="text-accent" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {focusAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-border-secondary bg-surface-muted px-3 py-1.5 text-sm font-semibold text-foreground-secondary"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-border-secondary bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-foreground-primary">Post ideas</h2>
                <CalendarDays size={18} className="text-accent-secondary" />
              </div>
              <div className="mt-4 space-y-3">
                {communityPrompts.map((prompt) => (
                  <div key={prompt} className="rounded-lg bg-surface-muted px-3 py-3 text-sm font-medium text-foreground-secondary">
                    {prompt}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
};
