import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { Avatar } from './Avatar';
import { UserPlus } from 'lucide-react';
import { getSuggestions } from '../services/usersService';

export const Suggestions = () => {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const items = await getSuggestions();
      setSuggestions(items);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && suggestions.length === 0) {
    return (
      <div className="rounded-lg border border-border-secondary bg-surface p-5 shadow-sm">
        <h2 className="font-bold text-foreground-primary">Who to follow</h2>
        <div className="mt-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-surface-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-surface-muted" />
                <div className="h-3 w-32 rounded bg-surface-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-secondary bg-surface p-5 shadow-sm">
      <h2 className="font-bold text-foreground-primary">Who to follow</h2>
      <div className="mt-4 space-y-4">
        {suggestions.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-3">
            <Link to={`/profile/${u.id}`} className="flex items-center gap-3 min-w-0">
              <Avatar
                name={u.full_name}
                username={u.username}
                url={u.profile_photo_url}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground-primary">
                  {u.full_name || u.username}
                </p>
                <p className="truncate text-xs text-foreground-tertiary">
                  {u.role || u.affiliation || `@${u.username}`}
                </p>
              </div>
            </Link>
            <Link
              to={`/profile/${u.id}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white"
            >
              <UserPlus size={14} />
            </Link>
          </div>
        ))}
      </div>
      <Link
        to="/people"
        className="mt-4 block text-center text-xs font-bold text-accent hover:underline"
      >
        View more
      </Link>
    </div>
  );
};
