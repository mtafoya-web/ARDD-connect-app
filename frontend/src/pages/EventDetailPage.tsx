import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowLeft, Share2 } from 'lucide-react';
import client from '../api/client';
import { Event } from '../types';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const handleRegisterInterest = () => {
    if (!event) return;
    const url = `${window.location.origin}/events/${id}`;
    if (navigator.share) {
      navigator
        .share({
          title: event.title,
          text: `I want to register interest in ${event.title}`,
          url,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert('Interest noted and event link copied to clipboard.');
    }
  };

  const handleShare = () => {
    if (!event) return;
    const url = `${window.location.origin}/events/${id}`;
    if (navigator.share) {
      navigator
        .share({
          title: event.title,
          text: event.description,
          url,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert('Event link copied to clipboard!');
    }
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await client.get<Event>(`/events/${id}`);
        setEvent(response.data);
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (loading)
    return (
      <main className="min-h-screen bg-canvas pt-20 text-center text-foreground-secondary">
        Loading event…
      </main>
    );
  if (!event)
    return (
      <main className="min-h-screen bg-canvas pt-20 text-center text-foreground-secondary">
        Event not found.
      </main>
    );

  return (
    <main className="min-h-screen bg-canvas pt-10 pb-12 text-foreground-primary">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground-secondary transition hover:text-accent"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <article>
          <header className="mb-8">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-accent/25 bg-accent-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">
                {event.ardd_meta?.sessionType || event.status}
              </span>
              {event.ardd_meta?.track && (
                <span className="text-xs font-bold uppercase tracking-widest text-foreground-tertiary">
                  {event.ardd_meta.track}
                </span>
              )}
              <span className="text-xs text-foreground-tertiary">
                Created {new Date(event.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-foreground-primary sm:text-4xl">{event.title}</h1>

            {event.ardd_meta?.topicTags && event.ardd_meta.topicTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {event.ardd_meta.topicTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full border border-accent/25 bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent"
                  >
                    {t.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </header>

          {event.image_url && (
            <div className="mb-10 aspect-video overflow-hidden rounded-lg border border-border-secondary bg-surface-muted shadow-sm">
              <img src={event.image_url} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-3 text-xl font-bold text-foreground-primary">About this session</h2>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground-secondary">
                {event.description}
              </p>

              {event.ardd_meta?.speakers && event.ardd_meta.speakers.length > 0 && (
                <section className="mt-8">
                  <h3 className="mb-3 text-lg font-bold text-foreground-primary">Speakers</h3>
                  <ul className="space-y-2">
                    {event.ardd_meta.speakers.map((sp, i) => (
                      <li
                        key={i}
                        className="rounded-md border border-border-secondary bg-surface p-3 text-sm"
                      >
                        <p className="font-bold text-foreground-primary">{sp.name}</p>
                        {sp.affiliation && (
                          <p className="text-foreground-secondary">{sp.affiliation}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-lg border border-border-secondary bg-surface p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-foreground-tertiary">
                  Session logistics
                </h3>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-accent-secondary">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-foreground-tertiary">
                        Location
                      </p>
                      <p className="font-bold text-foreground-primary">
                        {event.ardd_meta?.room || event.location}
                      </p>
                      {event.ardd_meta?.room && event.location !== event.ardd_meta.room && (
                        <p className="text-foreground-secondary">{event.location}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-accent">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-foreground-tertiary">
                        Date & time
                      </p>
                      <p className="font-bold text-foreground-primary">
                        {new Date(event.start_date).toLocaleString(undefined, {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRegisterInterest}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-bold text-foreground-inverse transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent/15"
                >
                  Register interest
                </button>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border-secondary bg-surface px-4 py-2.5 text-sm font-bold text-foreground-secondary transition hover:border-border-primary hover:text-foreground-primary"
              >
                <Share2 size={16} />
                Share session
              </button>
            </aside>
          </div>
        </article>
      </div>
    </main>
  );
};

export default EventDetailPage;
