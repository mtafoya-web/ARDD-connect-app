import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

const LABELS: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

const ICON: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export const ThemeToggle = ({ className = '' }: { className?: string }) => {
  const { mode, cycle } = useTheme();
  const Icon = ICON[mode];

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABELS[mode]}. Click to change.`}
      title={`Theme: ${LABELS[mode]} — click to cycle`}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-secondary bg-surface text-foreground-secondary transition hover:border-border-primary hover:text-foreground-primary focus:outline-none focus:ring-4 focus:ring-accent/15 ${className}`}
    >
      <Icon size={16} />
    </button>
  );
};
