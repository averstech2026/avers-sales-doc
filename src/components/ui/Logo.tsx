export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-label="Аверс">
      <rect x="8" y="12" width="32" height="24" rx="2" fill="#0052B4" />
      <rect x="12" y="16" width="24" height="14" rx="1" fill="#fff" />
      <rect x="14" y="18" width="8" height="2" rx="0.5" fill="#0052B4" opacity="0.6" />
      <rect x="14" y="22" width="14" height="2" rx="0.5" fill="#0052B4" opacity="0.4" />
      <rect x="14" y="26" width="10" height="2" rx="0.5" fill="#0052B4" opacity="0.3" />
      <rect x="18" y="36" width="12" height="4" fill="#1A1A1A" />
      <path d="M20 8h8v6h-8z" fill="#1A1A1A" />
      <circle cx="36" cy="10" r="4" fill="none" stroke="#1A1A1A" strokeWidth="1.5" />
      <path d="M34 10h4M36 8v4" stroke="#1A1A1A" strokeWidth="1" />
    </svg>
  );
}
