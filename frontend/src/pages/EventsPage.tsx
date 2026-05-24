import { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Clock, ArrowRight, Sparkles, Star, StarOff, Users2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Event, SessionDTO } from '../types';
import {
  getRecommendedSessions,
  getMySessions,
  starSession,
} from '../services/sessionsService';
import { InvalidIdError } from '../lib/ids';

type Tab = 'program' | 'recommended' | 'my';

const FOCUS_LABELS: Record<string, string> = {
  compbio_aging: 'Computational aging',
  aging_clocks: 'Aging clocks',
  partial_reprogramming: 'Partial reprogramming',
  epigenetics: 'Epigenetics',
  senescence: 'Senescence',
  proteostasis: 'Proteostasis',
  mitochondrial: 'Mitochondrial',
  immunoaging: 'Immune aging',
  cancer_aging: 'Cancer-aging',
  therapeutic_modalities: 'Therapeutics',
  geroscience_clinical: 'Clinical geroscience',
  ai_drug_discovery: 'AI drug discovery',
  longevity_biomarkers: 'Biomarkers',
};

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

const scoreColor = (score: number | null | undefined) => {
  if (score == null) return 'bg-surface-muted text-foreground-tertiary border-border-secondary';
  if (score >= 60) return 'bg-status-success/10 text-status-success border-status-success/30';
  if (score >= 40) return 'bg-status-warning/10 text-status-warning border-status-warning/30';
  return 'bg-surface-muted text-foreground-tertiary border-border-secondary';
};

const SessionRow = ({
  s,
  onStar,
  isAuthed,
}: {
  s: SessionDTO;
  onStar: (id: number, next: boolean) => void;
  isAuthed: boolean;
}) => {
  const tags = s.topicTags || [];

  return (
    <div className="overflow-hidden rounded-lg border border-border-secondary bg-surface shadow-sm transition hover:border-border-primary hover:shadow-md">
      {s.image_url && (
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-surface-muted">
          <img
            src={s.image_url}
            alt={s.title}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
          {s.sessionType && (
            <div className="absolute left-4 top-4 rounded-full bg-surface/95 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-accent shadow-sm backdrop-blur-sm">
              {s.sessionType.toUpperCase()}
            </div>
          )}
        </div>
      )}
      <div className="p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground-tertiary">
              {!s.image_url && s.sessionType && (
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-black tracking-widest text-accent">
                  {s.sessionType.toUpperCase()}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
              <Calendar size={12} className="text-accent" />
              {formatDay(s.start_date)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} className="text-accent" />
              {formatTime(s.start_date)}–{formatTime(s.end_date)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} className="text-accent-secondary" />
              {s.room || s.location}
            </span>
            {s.sessionType && (
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-black tracking-widest text-accent">
                {s.sessionType.toUpperCase()}
              </span>
            )}
          </div>

          <Link to={`/events/${s.id}`} className="mt-2 block">
            <h3 className="text-lg font-bold text-foreground-primary hover:text-accent">{s.title}</h3>
          </Link>

          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full border border-accent/25 bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent"
                >
                  {FOCUS_LABELS[t] || t.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        {s.score != null && (
          <div
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-bold ${scoreColor(
              s.score,
            )}`}
            title="Recommendation score"
          >
            <Sparkles size={14} />
            {s.score}
          </div>
        )}
      </div>

      {s.reasons && s.reasons.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-foreground-secondary">
          {s.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span className="leading-6">{r}</span>
            </li>
          ))}
        </ul>
      )}

      {s.speakers && s.speakers.length > 0 && (
        <p className="mt-3 inline-flex items-center gap-1 text-xs text-foreground-tertiary">
          <Users2 size={12} />
          {s.speakers.map((sp) => sp.name).join(', ')}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border-secondary pt-4">
        <Link
          to={`/events/${s.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-hover"
        >
          Details <ArrowRight size={14} />
        </Link>

        {isAuthed && (
          <button
            type="button"
            onClick={() => onStar(s.id, !s.starred)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              s.starred
                ? 'border-status-warning/40 bg-status-warning/10 text-status-warning hover:bg-status-warning/20'
                : 'border-border-secondary bg-surface text-foreground-secondary hover:border-accent/40 hover:text-accent'
            }`}
          >
            {s.starred ? <Star size={13} fill="currentColor" /> : <StarOff size={13} />}
            {s.starred ? 'Saved' : 'Add to my schedule'}
          </button>
        )}
      </div>
    </div>
    </div>
  );
};

const EventsPage = () => {
  const { token } = useAuth();
  const isAuthed = Boolean(token);

  const [tab, setTab] = useState<Tab>('program');

  const [events, setEvents] = useState<Event[]>([]);
  const [programLoading, setProgramLoading] = useState(true);

  const [recommended, setRecommended] = useState<SessionDTO[]>([]);
  const [my, setMy] = useState<SessionDTO[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setProgramLoading(true);
        const response = await client.get<Event[]>('/events/?status=current');
        setEvents(response.data);
      } catch (e) {
        console.error('Error fetching events:', e);
      } finally {
        setProgramLoading(false);
      }
    })();
  }, []);

  const loadRecommended = useCallback(async () => {
    if (!token) {
      setRecommended([]);
      setSessionsError('Sign in to see recommended sessions.');
      setSessionsLoading(false);
      return;
    }

    setSessionsLoading(true);
    setSessionsError('');

    try {
      const items = await getRecommendedSessions(20);
      setRecommended(items);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setSessionsError('Sign in to see recommended sessions.');
      } else {
        setSessionsError(err.response?.data?.detail || 'Failed to load recommendations');
      }
    } finally {
      setSessionsLoading(false);
    }
  }, [token]);

  const loadMy = useCallback(async () => {
    if (!token) {
      setMy([]);
      setSessionsError('Sign in to see your schedule.');
      setSessionsLoading(false);
      return;
    }

    setSessionsLoading(true);
    setSessionsError('');

    try {
      const items = await getMySessions();
      setMy(items);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setSessionsError('Sign in to see your schedule.');
      } else {
        setSessionsError(err.response?.data?.detail || 'Failed to load schedule');
      }
    } finally {
      setSessionsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab === 'recommended') loadRecommended();
    if (tab === 'my') loadMy();
  }, [tab, loadRecommended, loadMy]);

  const handleStar = async (id: number, next: boolean) => {
    if (!token) {
      setSessionsError('Sign in to save sessions to your schedule.');
      return;
    }

    try {
      // Service validates `id` is a positive integer before hitting the
      // backend, so /sessions/{id}/star never receives "NaN" or "undefined".
      await starSession(id, next);

      if (tab === 'recommended') {
        loadRecommended();
      }

      if (tab === 'my') {
        loadMy();
      }
    } catch (err: any) {
      if (err instanceof InvalidIdError) {
        setSessionsError('Could not save: invalid session id.');
      } else if (err.response?.status === 401) {
        setSessionsError('Sign in to save sessions to your schedule.');
      } else {
        setSessionsError(err.response?.data?.detail || 'Star toggle failed');
      }

      console.error('Star toggle failed', err);
    }
  };

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold transition ${
      active
        ? 'bg-accent text-foreground-inverse'
        : 'text-foreground-secondary hover:bg-surface-muted hover:text-foreground-primary'
    }`;

  return (
    <main className="min-h-screen bg-canvas pt-12 pb-12 text-foreground-primary">
      <div className="mx-auto max-w-page px-4 sm:px-6">
        <header className="mb-10">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-accent">
            ARDD 2026 · Boston Longevity Week
          </p>
          <h1 className="text-3xl font-bold text-foreground-primary sm:text-4xl">Program & Schedule</h1>
          <p className="mt-3 max-w-2xl text-foreground-secondary">
            Browse the full program, drill into your personalized recommendations, or open the schedule you've curated.
          </p>

          <div className="mt-6 inline-flex flex-wrap gap-1 rounded-full border border-border-secondary bg-surface p-1 shadow-sm">
            <button onClick={() => setTab('program')} className={tabClass(tab === 'program')}>
              <Calendar size={14} />
              Full Program
            </button>
            <button onClick={() => setTab('recommended')} className={tabClass(tab === 'recommended')}>
              <Sparkles size={14} />
              Recommended
            </button>
            <button onClick={() => setTab('my')} className={tabClass(tab === 'my')}>
              <Star size={14} />
              My Schedule
            </button>
          </div>
        </header>

        {tab === 'program' && (
          <>
            {programLoading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border-primary bg-surface p-16 text-center">
                <Calendar className="mx-auto mb-4 text-foreground-tertiary" size={56} />
                <h3 className="text-xl font-bold text-foreground-primary">No current events found</h3>
                <p className="text-foreground-secondary">Check back later for new updates.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="group flex flex-col overflow-hidden rounded-lg border border-border-secondary bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-border-primary hover:shadow-md"
                  >
                    <div className="relative aspect-video overflow-hidden bg-surface-muted">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-foreground-tertiary">
                          <Calendar size={48} />
                        </div>
                      )}

                      <div className="absolute left-4 top-4 rounded-full bg-surface/95 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-accent shadow-sm backdrop-blur-sm">
                        {event.ardd_meta?.sessionType || event.status}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="mb-2 text-lg font-bold text-foreground-primary group-hover:text-accent">
                        {event.title}
                      </h3>

                      <p className="mb-5 line-clamp-3 flex-1 text-sm leading-relaxed text-foreground-secondary">
                        {event.description}
                      </p>

                      <div className="space-y-2 border-t border-border-secondary pt-4 text-sm text-foreground-secondary">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-accent-secondary" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-accent" />
                          {new Date(event.start_date).toLocaleDateString(undefined, {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between text-sm font-bold text-accent">
                        <span>View details</span>
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {(tab === 'recommended' || tab === 'my') && (
          <div>
            {tab === 'recommended' && (
              <div className="mb-5 rounded-lg border border-accent/25 bg-accent-soft/60 p-4 text-sm leading-6 text-foreground-secondary">
                Ranked using your ARDD profile — research focus, role, conference goals, and the sessions you've already
                starred. Reasons reference literal fields from your profile.
              </div>
            )}

            {sessionsError && (
              <div className="mb-4 rounded-lg border border-status-error/25 bg-status-error/10 px-4 py-3 text-sm font-medium text-status-error">
                {sessionsError}
              </div>
            )}

            {sessionsLoading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
              </div>
            ) : (
              <div className="grid gap-4">
                {(tab === 'recommended' ? recommended : my).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border-primary bg-surface p-12 text-center">
                    {tab === 'my' ? (
                      <>
                        <Star className="mx-auto mb-3 text-foreground-tertiary" size={48} />
                        <h3 className="text-lg font-bold text-foreground-primary">Your schedule is empty</h3>
                        <p className="mt-1 text-sm text-foreground-secondary">
                          {isAuthed
                            ? 'Add sessions from the Recommended tab to start building your ARDD 2026 schedule.'
                            : 'Sign in to view and build your ARDD 2026 schedule.'}
                        </p>
                      </>
                    ) : (
                      <>
                        <Sparkles className="mx-auto mb-3 text-foreground-tertiary" size={48} />
                        <h3 className="text-lg font-bold text-foreground-primary">No recommendations yet</h3>
                        <p className="mt-1 text-sm text-foreground-secondary">
                          {isAuthed
                            ? 'Fill in your research focus and conference goals on your profile to unlock personalized recommendations.'
                            : 'Sign in to see personalized session recommendations.'}
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  (tab === 'recommended' ? recommended : my).map((s) => (
                    <SessionRow key={s.id} s={s} onStar={handleStar} isAuthed={isAuthed} />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default EventsPage;