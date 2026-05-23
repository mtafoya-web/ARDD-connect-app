import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

const STORAGE_KEY = 'ardd_demo_banner_dismissed';

export const DemoBanner = () => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 border-b border-official/30 bg-official-bg px-4 py-1.5 text-[12px] font-semibold text-official">
      <Sparkles size={12} />
      <span>
        ARDD 2026 demo build — attendees, sessions, and impressions are seeded. Production plan in the submission.
      </span>
      <button
        type="button"
        onClick={dismiss}
        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-official/70 hover:bg-official/15 hover:text-official"
        aria-label="Dismiss demo banner"
      >
        <X size={11} />
      </button>
    </div>
  );
};
