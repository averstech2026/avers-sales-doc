import { useId } from 'react';
import {
  getSlideBadgeIconMeta,
  type SlideBadgeIconId,
} from '../../utils/presentationSlides';

interface SlideBadgeIconProps {
  iconId: SlideBadgeIconId | string | undefined;
  className?: string;
  /** Smaller size for the editor picker */
  size?: 'slide' | 'picker';
}

const SVG_PROPS = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
};

function AiSparklesSvg({ gradientId }: { gradientId: string }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke={`url(#${gradientId})`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      {/* Lucide-style sparkles — main burst + side accents */}
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  );
}

function BadgeIconSvg({
  id,
  gradientId,
}: {
  id: Exclude<SlideBadgeIconId, 'none'>;
  gradientId: string;
}) {
  switch (id) {
    case 'ai':
      return <AiSparklesSvg gradientId={gradientId} />;
    case 'star':
      return (
        <svg {...SVG_PROPS}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'bolt':
      return (
        <svg {...SVG_PROPS}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...SVG_PROPS}>
          <path d="M12 2L2 12l10 10 10-10L12 2z" />
        </svg>
      );
    case 'check':
      return (
        <svg {...SVG_PROPS}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'chip':
      return (
        <svg {...SVG_PROPS}>
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      );
    case 'info':
      return (
        <svg {...SVG_PROPS}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
    default:
      return null;
  }
}

/** Inline SVG markup for PDF / HTML export (stroke icons). */
export function buildSlideBadgeIconSvgHtml(id: Exclude<SlideBadgeIconId, 'none'>): string {
  const common =
    'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  switch (id) {
    case 'ai':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" stroke="url(#ai-grad)" aria-hidden="true"><defs><linearGradient id="ai-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#2563eb"/></linearGradient></defs><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`;
    case 'star':
      return `<svg ${common}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    case 'bolt':
      return `<svg ${common}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
    case 'shield':
      return `<svg ${common}><path d="M12 2L2 12l10 10 10-10L12 2z"/></svg>`;
    case 'check':
      return `<svg ${common}><polyline points="20 6 9 17 4 12"/></svg>`;
    case 'chip':
      return `<svg ${common}><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`;
    case 'info':
      return `<svg ${common}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    default:
      return '';
  }
}

export function SlideBadgeIcon({ iconId, className = '', size = 'slide' }: SlideBadgeIconProps) {
  const reactId = useId().replace(/:/g, '');
  const meta = getSlideBadgeIconMeta(iconId);
  if (meta.id === 'none') return null;

  return (
    <span
      className={`slide-badge-icon-container ${meta.containerClass} ${
        size === 'picker' ? 'slide-badge-icon-container--picker' : ''
      } ${className}`.trim()}
      data-badge-type={meta.id}
      aria-hidden
    >
      <BadgeIconSvg id={meta.id} gradientId={`ai-grad-${reactId}`} />
    </span>
  );
}
