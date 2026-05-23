import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, ArrowRightLeft, Users2, Briefcase, Target, Clock, Quote } from 'lucide-react';
import client from '../api/client';
import { Avatar } from '../components/Avatar';
import type { ARDDMatchCompareResponse, ARDDMatchPublicProfile } from '../types';

const SCENARIO_LABELS: Record<string, string> = {
  investor_meets_startup: 'Investor ↔ Startup',
  startup_meets_pharma: 'Startup ↔ Pharma',
  pharma_meets_pharma: 'Pharma ↔ Pharma',
  academic_meets_biotech: 'Academic ↔ Biotech',
  academic_meets_academic: 'Academic ↔ Academic',
  biotech_meets_biotech: 'Biotech ↔ Biotech',
  general_networking: 'General networking',
};

const FOCUS_LABELS: Record<string, string> = {
  compbio_aging: 'Computational aging biology',
  aging_clocks: 'Aging clocks',
  partial_reprogramming: 'Partial reprogramming',
  epigenetics: 'Epigenetics',
  senescence: 'Cellular senescence',
  proteostasis: 'Proteostasis',
  mitochondrial: 'Mitochondrial biology',
  immunoaging: 'Immune aging',
  cancer_aging: 'Cancer-aging interface',
  therapeutic_modalities: 'Therapeutic modalities',
  geroscience_clinical: 'Clinical geroscience',
  ai_drug_discovery: 'AI drug discovery',
  longevity_biomarkers: 'Longevity biomarkers',
};

const GOAL_LABELS: Record<string, string> = {
  raise_capital: 'Raise capital',
  find_collaborators: 'Find research collaborators',
  recruit_talent: 'Recruit talent',
  find_jobs: 'Find a role',
  license_in: 'License in',
  license_out: 'License out',
  find_co_founders: 'Find co-founders',
  learn_field: 'Deploy capital',
  meet_press: 'Meet press',
  meet_kols: 'Meet KOLs',
  find_cros: 'Find CROs',
  pilot_clinical_partner: 'Pilot clinical partner',
};

const labelize = (dict: Record<string, string>, key: string) =>
  dict[key] || key.replace(/_/g, ' ');

const Column = ({ profile, title }: { profile: ARDDMatchPublicProfile; title: string }) => (
  <div className="flex flex-col gap-4 rounded-lg border border-border-secondary bg-surface p-5 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-wide text-accent">{title}</p>
    <div className="flex items-start gap-3">
      <Avatar name={profile.full_name} username={profile.username} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-xl font-bold text-foreground-primary">
          {profile.full_name || profile.username}
        </h3>
        <p className="mt-0.5 truncate text-sm text-foreground-secondary">{profile.affiliation}</p>
      </div>
    </div>

    {profile.introTagline && (
      <p className="text-sm italic leading-6 text-foreground-secondary">“{profile.introTagline}”</p>
    )}

    <div className="space-y-3 text-sm">
      {profile.role && (
        <div className="flex items-start gap-2">
          <Briefcase size={16} className="mt-0.5 shrink-0 text-foreground-tertiary" />
          <span>
            <span className="font-bold text-foreground-primary">{profile.role.replace(/_/g, ' ')}</span>
            {profile.companyStage && (
              <span className="text-foreground-secondary"> · {profile.companyStage}</span>
            )}
          </span>
        </div>
      )}

      {profile.researchFocus && profile.researchFocus.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-foreground-tertiary">
            <Target size={12} /> Research focus
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.researchFocus.map((f) => (
              <span
                key={f}
                className="inline-flex items-center rounded-full border border-border-secondary bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-foreground-primary"
              >
                {labelize(FOCUS_LABELS, f)}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.businessGoals && profile.businessGoals.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-foreground-tertiary">
            <Users2 size={12} /> Conference goals
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.businessGoals.map((g) => (
              <span
                key={g}
                className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent"
              >
                {labelize(GOAL_LABELS, g)}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.availability && profile.availability.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-foreground-tertiary">
            <Clock size={12} /> Availability
          </p>
          <ul className="space-y-0.5 text-foreground-secondary">
            {profile.availability.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
);

export const MatchComparePage = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ARDDMatchCompareResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await client.get<ARDDMatchCompareResponse>(`/matches/compare/${candidateId}`);
        if (!cancelled) setData(res.data);
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.detail || 'Failed to load match');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  return (
    <main className="min-h-screen bg-canvas px-4 py-8 text-foreground-primary sm:py-10">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground-secondary hover:text-accent"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {loading && (
          <div className="rounded-lg border border-border-secondary bg-surface p-10 text-center text-foreground-secondary shadow-sm">
            Loading match…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-status-error/25 bg-status-error/10 px-4 py-3 text-sm font-medium text-status-error">
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-wide text-accent">Side-by-side match</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold sm:text-4xl">
                  Match · {data.score}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border-secondary bg-surface-muted px-3 py-1 text-sm font-bold uppercase tracking-wide text-foreground-secondary">
                  <ArrowRightLeft size={13} />
                  {SCENARIO_LABELS[data.scenario] || data.scenario.replace(/_/g, ' ')}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                  <Sparkles size={12} /> deterministic explanation
                </span>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Column profile={data.me} title="You" />
              <Column profile={data.them} title="Them" />
            </div>

            <section className="mt-6 rounded-lg border border-border-secondary bg-surface p-5 shadow-sm">
              <h2 className="text-lg font-bold">Why this match</h2>
              <ul className="mt-3 space-y-2 text-foreground-primary">
                {data.reasons.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="leading-6">{b}</span>
                  </li>
                ))}
              </ul>

              {data.reasons.conversationStarter && (
                <div className="mt-5 rounded-md border border-border-secondary bg-surface-muted p-4">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-foreground-tertiary">
                    <Quote size={12} /> Conversation starter
                  </p>
                  <p className="text-sm leading-6 text-foreground-primary">
                    {data.reasons.conversationStarter}
                  </p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to={`/messages?userId=${data.them.id}&prefill=${encodeURIComponent(
                    data.reasons.conversationStarter || '',
                  )}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent/90"
                >
                  <Users2 size={14} />
                  Request intro
                </Link>
                <Link
                  to={`/profile/${data.them.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border-secondary bg-surface px-4 py-2 text-sm font-bold text-foreground-primary hover:border-border-primary"
                >
                  View full profile
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};
