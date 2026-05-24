import { useState, useEffect } from 'react';
import type { User, ARDDMatchCard } from '../types';
import { ProfileCard } from '../components/ProfileCard';
import { MatchCard } from '../components/MatchCard';
import { Filter, Search, UsersRound, Sparkles } from 'lucide-react';
import { getMyMatches } from '../services/matchesService';
import { listUsers } from '../services/usersService';

type Tab = 'directory' | 'matches';

export const PeoplePage = () => {
  const [tab, setTab] = useState<Tab>('directory');

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [matches, setMatches] = useState<ARDDMatchCard[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState('');
  const [matchesLoaded, setMatchesLoaded] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, areaFilter]);

  useEffect(() => {
    if (tab === 'matches' && !matchesLoaded) fetchMatches();
  }, [tab, matchesLoaded]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const items = await listUsers();
      setUsers(items);
      const uniqueAreas = Array.from(
        new Set(items.map((u) => u.area_of_study).filter(Boolean))
      ) as string[];
      setAreas(uniqueAreas.sort());
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      setMatchesLoading(true);
      setMatchesError('');
      // Service normalizes the envelope; we map over .matches because
      // the backend wraps the list inside `{ me, matches }`.
      const data = await getMyMatches();
      setMatches(data.matches);
      setMatchesLoaded(true);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setMatchesError('Sign in to see your personalized ARDD matches.');
      } else {
        setMatchesError(err.response?.data?.detail || 'Failed to load matches');
      }
    } finally {
      setMatchesLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(query) ||
          (u.full_name && u.full_name.toLowerCase().includes(query)) ||
          (u.affiliation && u.affiliation.toLowerCase().includes(query))
      );
    }

    if (areaFilter) {
      filtered = filtered.filter((u) => u.area_of_study === areaFilter);
    }

    setFilteredUsers(filtered);
  };

  return (
    <main className="min-h-screen bg-canvas px-4 py-8 text-foreground-primary sm:py-10">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-accent">Attendees</p>
            <h1 className="mt-1 text-3xl font-bold text-foreground-primary sm:text-4xl">
              Explore the ARDD community
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-foreground-secondary">
              Browse the full ARDD 2026 attendee directory, or jump to your personalized top matches.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border-secondary bg-surface px-3 py-2 text-sm font-semibold text-foreground-secondary">
            <UsersRound size={17} className="text-accent" />
            {tab === 'directory' ? `${filteredUsers.length} shown` : `${matches.length} matches`}
          </div>
        </div>

        <div className="mb-6 inline-flex rounded-lg border border-border-secondary bg-surface p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab('directory')}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-bold ${
              tab === 'directory'
                ? 'bg-accent text-white'
                : 'text-foreground-secondary hover:text-foreground-primary'
            }`}
          >
            <UsersRound size={15} />
            Directory
          </button>
          <button
            type="button"
            onClick={() => setTab('matches')}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-bold ${
              tab === 'matches'
                ? 'bg-accent text-white'
                : 'text-foreground-secondary hover:text-foreground-primary'
            }`}
          >
            <Sparkles size={15} />
            Top Matches
          </button>
        </div>

        {tab === 'directory' && (
          <>
            <section className="mb-7 rounded-lg border border-border-secondary bg-surface p-4 shadow-sm sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" size={20} />
                  <input
                    type="text"
                    placeholder="Search by name, username, or affiliation"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 w-full rounded-lg border border-border-secondary bg-surface-muted pl-11 pr-4 text-foreground-primary outline-none placeholder:text-foreground-tertiary focus:border-border-focus focus:bg-surface focus:ring-4 focus:ring-accent/15"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" size={19} />
                  <select
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    className="h-12 w-full appearance-none rounded-lg border border-border-secondary bg-surface-muted pl-11 pr-4 text-foreground-primary outline-none focus:border-border-focus focus:bg-surface focus:ring-4 focus:ring-accent/15"
                  >
                    <option value="">All areas of study</option>
                    {areas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {error && (
              <div className="mb-4 rounded-lg border border-status-error/25 bg-status-error/10 px-4 py-3 text-sm font-medium text-status-error">
                {error}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="rounded-lg border border-border-secondary bg-surface p-5 shadow-sm">
                    <div className="flex gap-3">
                      <div className="h-11 w-11 rounded-full bg-surface-muted" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 w-36 rounded bg-surface-muted" />
                        <div className="h-3 w-24 rounded bg-surface-muted" />
                      </div>
                    </div>
                    <div className="mt-5 h-3 w-full rounded bg-surface-muted" />
                    <div className="mt-2 h-3 w-2/3 rounded bg-surface-muted" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border-primary bg-surface p-10 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-accent">
                  <UsersRound size={22} />
                </div>
                <h2 className="mt-4 text-xl font-bold text-foreground-primary">No researchers found</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-foreground-secondary">
                  Try a broader search, clear the area filter, or look for collaborators by affiliation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredUsers.map((user) => (
                  <ProfileCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'matches' && (
          <>
            <div className="mb-5 rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm leading-6 text-foreground-secondary">
              <p>
                Ranked using your ARDD profile — role, research focus, business goals, availability, and stated session interests.
                Every reason references a literal field from both profiles; no LLM hallucination.
              </p>
            </div>

            {matchesError && (
              <div className="mb-4 rounded-lg border border-status-error/25 bg-status-error/10 px-4 py-3 text-sm font-medium text-status-error">
                {matchesError}
              </div>
            )}

            {matchesLoading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="rounded-lg border border-border-secondary bg-surface p-5 shadow-sm">
                    <div className="flex gap-3">
                      <div className="h-11 w-11 rounded-full bg-surface-muted" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 w-36 rounded bg-surface-muted" />
                        <div className="h-3 w-24 rounded bg-surface-muted" />
                      </div>
                    </div>
                    <div className="mt-5 h-3 w-full rounded bg-surface-muted" />
                    <div className="mt-2 h-3 w-2/3 rounded bg-surface-muted" />
                  </div>
                ))}
              </div>
            ) : matches.length === 0 && !matchesError ? (
              <div className="rounded-lg border border-dashed border-border-primary bg-surface p-10 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-accent">
                  <Sparkles size={22} />
                </div>
                <h2 className="mt-4 text-xl font-bold text-foreground-primary">No matches yet</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-foreground-secondary">
                  Fill in your research focus, conference goals, and availability on your profile to unlock personalized matches.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {matches.map((m) => (
                  <MatchCard key={m.matchId} match={m} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};
