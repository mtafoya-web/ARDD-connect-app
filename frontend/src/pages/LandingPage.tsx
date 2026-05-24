import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  FlaskConical,
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  UsersRound,
  Calendar,
  Megaphone,
  MapPin,
  Clock,
} from 'lucide-react';
import client from '../api/client';
import { Event, Post } from '../types';

const previewPosts = [
  {
    name: 'Maya Chen',
    handle: '@maya-aging',
    role: 'Postdoc, Buck Institute',
    tag: 'Collaboration ask',
    content: 'Looking for feedback on a senescence assay before scaling a translational screen. Has anyone compared brightfield readouts with p16 reporter lines?',
    replies: '18',
  },
  {
    name: 'Noah Patel',
    handle: '@npatel-bioage',
    role: 'Biomarkers, Caltech',
    tag: 'Paper discussion',
    content: 'New preprint on plasma biomarkers of biological age. Curious how others are validating cross-cohort signal before moving into intervention studies.',
    replies: '24',
  },
];

const connectionCards = [
  {
    name: 'Elena Rossi',
    role: 'Principal Investigator',
    focus: 'Longevity therapeutics',
    lookingFor: 'Clinical translation partners',
  },
  {
    name: 'Samir Okafor',
    role: 'Computational biologist',
    focus: 'AI discovery',
    lookingFor: 'Wet-lab validation collaborators',
  },
];

const steps = [
  'Create a research profile that makes your work and collaboration needs clear.',
  'Find researchers working on adjacent problems in aging biology and drug discovery.',
  'Turn useful posts into replies, follows, and real research connections.',
];

const actionClass =
  'inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-foreground-secondary hover:bg-surface-muted hover:text-foreground-primary focus:outline-none focus:ring-4 focus:ring-accent/15';

export const LandingPage = () => {
  const [latestEvents, setLatestEvents] = useState<Event[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, postsRes] = await Promise.all([
          client.get<Event[]>('/events/?status=current'),
          client.get<Post[]>('/posts/global'),
        ]);
        setLatestEvents(eventsRes.data.slice(0, 3));
        setLatestPosts(postsRes.data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching landing page data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-canvas text-foreground-primary">
      <section className="border-b border-border-secondary bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1fr)] lg:items-center lg:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-accent-secondary">
              ARDD 2026 · Boston Longevity Week · Network Intelligence Tool
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-foreground-primary sm:text-5xl">
              Your conference, mapped.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-foreground-secondary">
              Personalized program recommendations, scored attendee matches with deterministic explanations, and an in-app Claw Bot — all reusing your ARDD profile.
            </p>

            <section className="mt-6 rounded-md border border-border-secondary bg-surface p-4">
              <h3 className="text-lg font-bold text-foreground-primary">What is ARDD?</h3>
              <p className="mt-2 text-sm text-foreground-secondary">
                ARDD (Aging Research & Drug Discovery) Connect is a network intelligence platform that helps researchers, clinicians, and industry partners discover relevant collaborators, curate event programs, and turn conversations into actionable research connections.
              </p>
              <h4 className="mt-3 text-sm font-bold text-foreground-primary">Goals</h4>
              <ul className="mt-2 list-inside list-disc text-sm text-foreground-secondary">
                <li>Surface high-quality matches between attendees based on research focus and collaboration needs.</li>
                <li>Provide personalized program recommendations to maximize conference value.</li>
                <li>Make it easy to start and sustain research conversations before, during, and after ARDD.</li>
              </ul>
            </section>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-foreground-inverse shadow-sm hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent/20"
              >
                Try the demo
                <ArrowRight size={17} />
              </Link>
              <Link
                to="/events"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-primary bg-surface px-5 py-3 text-sm font-bold text-foreground-primary hover:bg-surface-muted focus:outline-none focus:ring-4 focus:ring-accent/15"
              >
                Browse the program
              </Link>
            </div>
          </div>

          <section aria-label="Public feed preview" className="rounded-lg border border-border-secondary bg-canvas p-3 shadow-md">
            <div className="rounded-md border border-border-secondary bg-surface">
              <div className="flex items-center justify-between border-b border-border-secondary px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-foreground-primary">Community signals</p>
                  <p className="text-xs text-foreground-tertiary">Public preview</p>
                </div>
                <Link
                  to="/register"
                  className="inline-flex min-h-9 items-center gap-2 rounded-full bg-surface-muted px-3 text-sm font-bold text-foreground-primary hover:bg-accent hover:text-foreground-inverse"
                >
                  <UsersRound size={15} />
                  Connect
                </Link>
              </div>

              <div className="divide-y divide-border-secondary">
                {previewPosts.map((post) => (
                  <article key={post.handle} className="px-4 py-4">
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-bold text-accent">
                        {post.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="font-bold text-foreground-primary">{post.name}</p>
                          <p className="text-sm text-foreground-tertiary">{post.handle}</p>
                          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-bold text-accent">
                            {post.tag}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-foreground-tertiary">{post.role}</p>
                        <p className="mt-3 text-[15px] leading-relaxed text-foreground-secondary">{post.content}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* Featured Events Section */}
      {latestEvents.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground-primary">
              <Calendar className="text-accent" />
              Latest Events
            </h2>
            <Link to="/events" className="text-sm font-bold text-accent hover:underline">
              View all events
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {latestEvents.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border-secondary bg-surface transition-all hover:border-accent/20 hover:shadow-lg"
              >
                <div className="aspect-video overflow-hidden bg-surface-muted">
                  {event.image_url ? (
                    <img src={event.image_url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-foreground-tertiary">
                      <Calendar size={32} />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="mb-2 font-bold text-foreground-primary group-hover:text-accent">{event.title}</h3>
                  <div className="flex flex-col gap-2 text-xs text-foreground-tertiary">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      {new Date(event.start_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured News Section */}
      {latestPosts.length > 0 && (
        <section className="bg-surface-muted py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground-primary">
                <Megaphone className="text-accent-secondary" />
                Announcements
              </h2>
              <Link to="/announcements" className="text-sm font-bold text-accent hover:underline">
                View all news
              </Link>
            </div>
            <div className="grid gap-6">
              {latestPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/announcements/${post.id}`}
                  className="flex flex-col gap-6 rounded-2xl border border-border-secondary bg-surface p-6 transition-all hover:border-accent/20 hover:shadow-lg sm:flex-row"
                >
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                        {post.category}
                      </span>
                      <span className="text-[10px] font-bold text-foreground-tertiary">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-foreground-primary">{post.title || 'Official Update'}</h3>
                    <p className="line-clamp-2 text-sm text-foreground-secondary">{post.content}</p>
                  </div>
                  {post.media && post.media.length > 0 && (
                    <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-surface-muted sm:w-40">
                      <img src={post.media[0].url} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:py-16">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-accent">Connection engine</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-foreground-primary">
            Explore the ARDD community.
          </h2>
          <p className="mt-4 leading-relaxed text-foreground-secondary">
            Every profile is designed to answer what someone studies, where they work, and why they may be relevant to aging research or drug discovery.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {connectionCards.map((person) => (
            <article key={person.name} className="rounded-lg border border-border-secondary bg-surface p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-bold text-accent">
                  {person.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </div>
                <div>
                  <h3 className="font-bold text-foreground-primary">{person.name}</h3>
                  <p className="mt-1 text-sm text-foreground-secondary">{person.role}</p>
                </div>
              </div>
              <dl className="mt-5 grid gap-3 text-sm">
                <div>
                  <dt className="font-bold uppercase tracking-wide text-foreground-tertiary">Focus</dt>
                  <dd className="mt-1 text-foreground-secondary">{person.focus}</dd>
                </div>
                <div>
                  <dt className="font-bold uppercase tracking-wide text-foreground-tertiary">Looking for</dt>
                  <dd className="mt-1 text-foreground-secondary">{person.lookingFor}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border-secondary bg-surface-muted">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:py-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-accent">How it works</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-foreground-primary">
              From conference profile to useful connection.
            </h2>
          </div>
          <ol className="grid gap-3">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4 rounded-lg border border-border-secondary bg-surface p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-foreground-inverse">
                  {index + 1}
                </span>
                <p className="self-center text-base leading-relaxed text-foreground-secondary">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-8 rounded-lg border border-border-secondary bg-surface p-6 shadow-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent">
              <FlaskConical size={17} />
              Built for focused research exchange
            </div>
            <h2 className="mt-3 text-2xl font-bold text-foreground-primary">
              Start with the ARDD community map.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-foreground-secondary">
              Join researchers, labs, and drug discovery teams preparing for ARDD 2026.
            </p>
          </div>
          <Link
            to="/register"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-foreground-inverse shadow-sm hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent/20"
          >
            Join the community
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
};
