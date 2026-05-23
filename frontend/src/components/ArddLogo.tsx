interface ArddLogoProps {
  compact?: boolean;
  inverse?: boolean;
}

export const ArddLogo = ({ compact = false, inverse = false }: ArddLogoProps) => {
  const textColor = inverse ? 'text-foreground-inverse' : 'text-foreground-primary';

  return (
    <div
      className={`leading-none ${compact ? 'text-lg' : 'text-[28px]'} font-bold tracking-normal ${textColor}`}
      aria-label="ARDD Connect"
    >
      ARDD Connect
    </div>
  );
};
