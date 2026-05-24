import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { User, Post } from '../types';
import {
  getUser,
  getUserPosts,
  getUserBookmarks,
} from '../services/usersService';
import { Avatar } from '../components/Avatar';
import { PostCard } from '../components/PostCard';
import {
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Briefcase,
  Edit,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';

export const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [id]);

  useEffect(() => {
    if (profile && currentUser && profile.id !== currentUser.id) {
      checkFollowStatus(profile.id);
    }

    if (profile && currentUser && profile.id === currentUser.id) {
      fetchBookmarks();
    } else {
      setBookmarks([]);
    }
  }, [profile, currentUser]);

  const checkFollowStatus = async (profileId: number) => {
    try {
      const response = await client.get<{ following: boolean }>(`/follows/${profileId}`);
      setIsFollowing(Boolean(response.data.following));
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error('Failed to load follow status:', err);
      }
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const me = await getUser(id);
      if (!me) {
        setError('Profile not found');
        return;
      }
      setProfile(me);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const items = await getUserPosts(id);
      setPosts(items);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  const fetchBookmarks = async () => {
    if (!currentUser || profile?.id !== currentUser.id) {
      return;
    }
    try {
      const items = await getUserBookmarks(currentUser.id);
      setBookmarks(items);
    } catch (err) {
      console.error('Failed to fetch saved posts:', err);
      setBookmarks([]);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile) return;

    try {
      setFollowLoading(true);
      if (isFollowing) {
        await client.delete(`/follows/${profile.id}`);
        setIsFollowing(false);
      } else {
        await client.post(`/follows/${profile.id}`);
        setIsFollowing(true);
      }
      fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-4 text-foreground-primary">
        <div className="w-full max-w-2xl rounded-lg border border-border-secondary bg-surface p-6 shadow-sm">
          <div className="flex gap-4">
            <div className="h-16 w-16 rounded-full bg-surface-muted" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-48 rounded bg-surface-muted" />
              <div className="h-4 w-32 rounded bg-surface-muted" />
              <div className="h-3 w-full rounded bg-surface-muted" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-4 text-foreground-primary">
        <div className="max-w-md rounded-lg border border-status-error/25 bg-status-error/10 px-5 py-4 text-sm font-medium text-status-error">
          <p>{error || 'Profile not found'}</p>
          <Link to="/people" className="mt-4 inline-flex items-center gap-2 font-bold text-accent hover:text-accent-hover">
            Browse researchers
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </main>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const displayName = profile.full_name || profile.username;

  return (
    <main className="min-h-screen bg-canvas text-foreground-primary">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-border-secondary bg-surface p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <Avatar
                  name={profile.full_name}
                  username={profile.username}
                  url={profile.profile_photo_url}
                  size="xl"
                  className="ring-4 ring-surface"
                />
                <div className="pb-1">
                  <p className="text-sm font-bold uppercase tracking-wide text-accent">Research profile</p>
                  <h1 className="mt-2 text-3xl font-bold text-foreground-primary sm:text-4xl">
                    {displayName}
                  </h1>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex gap-3 text-sm font-semibold text-foreground-secondary">
                      <span>{profile.followers_count || 0} followers</span>
                      <span>{profile.following_count || 0} following</span>
                    </div>
                  </div>
                </div>
              </div>

              {isOwnProfile ? (
                <Link
                  to="/edit-profile"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-foreground-inverse shadow-sm hover:bg-accent-hover"
                >
                  <Edit size={17} />
                  Edit profile
                </Link>
              ) : currentUser ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                      isFollowing
                        ? 'border border-border-secondary bg-surface text-foreground-primary hover:bg-surface-muted'
                        : 'bg-accent text-foreground-inverse hover:bg-accent-hover'
                    }`}
                    type="button"
                  >
                    <UserPlus size={17} />
                    {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <Link
                    to={`/messages?userId=${profile.id}`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border-secondary bg-surface px-5 py-2.5 text-sm font-bold text-foreground-primary shadow-sm hover:bg-surface-muted"
                  >
                    <MessageSquare size={17} />
                    Message
                  </Link>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-foreground-inverse shadow-sm hover:bg-accent-hover"
                >
                  <Users size={17} />
                  Sign in to connect
                </Link>
              )}
            </div>

            <div className="max-w-2xl">
              <p className="text-lg leading-8 text-foreground-secondary">
                {profile.bio || 'No bio added yet.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.role && (
                <span className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-bold uppercase tracking-widest text-accent">
                  {profile.role}
                </span>
              )}
              {profile.is_expert && profile.expert_profile?.field && (
                <span className="rounded-full bg-surface-muted px-3 py-1.5 text-sm font-semibold text-foreground-secondary">
                  {profile.expert_profile.field}
                </span>
              )}
              {profile.area_of_study && (
                <span className="rounded-full bg-surface-muted px-3 py-1.5 text-sm font-semibold text-foreground-secondary">
                  {profile.area_of_study}
                </span>
              )}
              {profile.location && (
                <span className="rounded-full bg-surface-muted px-3 py-1.5 text-sm font-semibold text-accent">
                  {profile.location}
                </span>
              )}
            </div>

            {profile.is_expert && profile.expert_profile?.keywords && (
              <div className="flex flex-wrap gap-2 border-t border-border-secondary pt-4">
                {profile.expert_profile.keywords.split(',').map((kw: string) => (
                  <span key={kw} className="rounded-md border border-border-secondary px-2 py-0.5 text-xs font-medium text-foreground-tertiary">
                    #{kw.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4 lg:row-span-2">
          <section className="rounded-lg border border-border-secondary bg-surface p-5 shadow-sm">
            <h2 className="font-bold text-foreground-primary">Profile details</h2>
            <div className="mt-4 space-y-4 text-sm text-foreground-secondary">
              {profile.email && (
                <div className="flex items-start gap-3">
                  <Mail size={18} className="mt-0.5 text-foreground-tertiary" />
                  <span className="min-w-0 break-all">{profile.email}</span>
                </div>
              )}
              {profile.affiliation && (
                <div className="flex items-start gap-3">
                  <Briefcase size={18} className="mt-0.5 text-foreground-tertiary" />
                  <span>{profile.affiliation}</span>
                </div>
              )}
              {profile.area_of_study && (
                <div className="flex items-start gap-3">
                  <BookOpen size={18} className="mt-0.5 text-accent-secondary" />
                  <span>{profile.area_of_study}</span>
                </div>
              )}
              {profile.location && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="mt-0.5 text-accent" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-start gap-3">
                  <Globe size={18} className="mt-0.5 text-foreground-tertiary" />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 break-all font-semibold text-accent hover:text-accent-hover"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
            </div>
          </section>

          <Link
            to="/people"
            className="flex items-center justify-between rounded-lg border border-border-secondary bg-surface p-5 text-sm font-bold text-foreground-primary shadow-sm hover:border-border-primary hover:bg-surface-muted"
          >
            Browse more researchers
            <ArrowUpRight size={17} className="text-accent" />
          </Link>
        </aside>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border-secondary bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground-tertiary">
              <Sparkles size={16} className="text-accent" />
              Research interests
            </div>
            <p className="mt-4 leading-7 text-foreground-secondary">
              {profile.research_interests || 'No research interests added yet.'}
            </p>
          </div>

          <div className="rounded-lg border border-border-secondary bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground-tertiary">
              <UserPlus size={16} className="text-accent-secondary" />
              Looking for
            </div>
            <p className="mt-4 leading-7 text-foreground-secondary">
              {profile.looking_for || 'No collaboration preferences added yet.'}
            </p>
          </div>
        </section>

        <section className="mt-6 space-y-6 lg:col-span-1">
          <div className="flex items-center gap-3 border-b border-border-secondary pb-4">
            <MessageSquare size={20} className="text-accent" />
            <h2 className="text-xl font-bold text-foreground-primary">Post history</h2>
          </div>
          
          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={(deletedPostId) =>
                    setPosts((current) => current.filter((item) => item.id !== deletedPostId))
                  }
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border-secondary py-12 text-center text-foreground-tertiary">
                No posts shared yet.
              </div>
            )}
          </div>
        </section>

        {isOwnProfile && (
          <section className="mt-6 space-y-6 lg:col-span-1">
            <div className="flex items-center gap-3 border-b border-border-secondary pb-4">
              <Bookmark size={20} className="text-accent-secondary" />
              <h2 className="text-xl font-bold text-foreground-primary">Saved posts</h2>
            </div>

            <div className="space-y-4">
              {bookmarks.length > 0 ? (
                bookmarks.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onDelete={(deletedPostId) =>
                      setBookmarks((current) => current.filter((item) => item.id !== deletedPostId))
                    }
                  />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border-secondary py-12 text-center text-foreground-tertiary">
                  No saved posts yet. Bookmark posts to keep ideas and references handy.
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};
