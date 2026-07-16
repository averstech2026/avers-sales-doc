import {
  getSlideBadgeIconMeta,
  type SlideBadgeIconId,
} from '../../utils/presentationSlides';

interface SlideBadgeIconProps {
  iconId: SlideBadgeIconId | string | undefined;
  className?: string;
}

export function SlideBadgeIcon({ iconId, className = '' }: SlideBadgeIconProps) {
  const meta = getSlideBadgeIconMeta(iconId);
  if (meta.id === 'none') return null;

  return (
    <span
      className={`kp-slide__badge-icon ${meta.className} ${className}`.trim()}
      aria-hidden
    >
      {meta.glyph}
    </span>
  );
}
