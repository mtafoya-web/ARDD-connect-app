import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles, Users2, ArrowRightLeft, Quote } from 'lucide-react';
import { Avatar } from './Avatar';
import type { ARDDMatchCard } from '../types';

interface MatchCardProps {
  match: ARDDMatchCard;
}

const SCENARIO_LABELS: Record<string, string> = {
  investor_meets_startup: 'Investor ↔ Startup',
  startup_meets_pharma: 'Startup ↔ Pharma',
  pharma_meets_pharma: 'Pharma ↔ Pharma',
  academic_meets_biotech: 'Academic ↔ Biotech',
  academic_meets_academic: 'Academic ↔ Academic',
  biotech_meets_biotech: 'Biotech ↔ Biotech',
  general_networking: 'General networking',
};

const scoreColor = (score: number): string => {
  if (score >= 70) return 'bg-status-success/10 text-status-success border-status-success/30';
  if (score >= 50) return 'bg-accent-soft text-accent border-accent/30';
  return 'bg-surface-muted text-foreground-tertiary border-border-secondary';
};

export const MatchCard = ({ match }: MatchCardProps) => {
  const { candidate, score, scenario, reasons } = match;
  const scenarioLabel = SCENARIO_LABELS[scenario] || scenario.replace(/_/g, ' ');

  return (
    <article className="flex h-full flex-col rounded-lg border border-border-secondary bg-surface p-5 shadow-sm transition hover:border-border-primary hover:shadow-md">
      <div className="flex items-start gap-3">
        <Avatar name={candidate.full_name} username={candidate.username} />
        <div className="min-w-0 flex-1">
          <Link to={`/profile/${candidate.id}`} className="block">
            <h3 className="truncate text-lg font-bold text-foreground-primary hover:text-accent">
              {candidate.full_name || candidate.username}
            </h3>
          </Link>
          <p className="mt-0.5 truncate text-sm text-foreground-secondary">{candidate.affiliation}</p>
        </div>
        <div
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-bold ${scoreColor(
            score,
          )}`}
          title="Match score (0–100)"
        >
          <Sparkles size={14} />
          {score}
        </div>
      </div>

      <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-border-secondary bg-surface-muted px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-foreground-secondary">
        <ArrowRightLeft size={12} />
        {scenarioLabel}
      </div>

      {candidate.introTagline && (
        <p className="mt-4 text-sm leading-6 text-foreground-secondary italic">
          “{candidate.introTagline}”
        </p>
      )}

      <ul className="mt-4 flex-1 space-y-2 text-sm text-foreground-primary">
        {reasons.bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span className="leading-6">{b}</span>
          </li>
        ))}
      </ul>

      {reasons.conversationStarter && (
        <div className="mt-4 rounded-md border border-border-secondary bg-surface-muted p-3">
          <p className="flex items-start gap-2 text-xs leading-5 text-foreground-secondary">
            <Quote size={14} className="mt-0.5 shrink-0 text-accent" />
            <span>{reasons.conversationStarter}</span>
          </p>
        </div>
      )}

      <div className="mt-5 flex items-center gap-3 border-t border-border-secondary pt-4">
        <Link
          to={`/matches/${candidate.id}`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-bold text-white hover:bg-accent/90"
        >
          See side-by-side
          <ArrowUpRight size={14} />
        </Link>
        <Link
          to={`/messages?userId=${candidate.id}&prefill=${encodeURIComponent(
            reasons.conversationStarter || '',
          )}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border-secondary bg-surface px-3 py-2 text-sm font-bold text-foreground-primary hover:border-border-primary"
        >
          <Users2 size={14} />
          Request intro
        </Link>
      </div>
    </article>
  );
};
