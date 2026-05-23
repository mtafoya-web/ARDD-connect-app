interface AvatarProps {
  name?: string | null;
  username?: string | null;
  url?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-24 w-24 text-2xl',
};

export const getInitials = (name?: string | null, username?: string | null) => {
  const source = (name || username || 'AR').trim();
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

export const Avatar = ({ name, username, url, size = 'md', className = '' }: AvatarProps) => {
  return (
    <div
      className={`${sizeClasses[size]} ${className} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted font-semibold text-accent shadow-sm ring-1 ring-border-secondary`}
      aria-hidden="true"
    >
      {url ? (
        <img src={url} alt={name || username || 'Avatar'} className="h-full w-full object-cover" />
      ) : (
        getInitials(name, username)
      )}
    </div>
  );
};
