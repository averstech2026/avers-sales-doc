import type { ClientLogoId, Estimate } from '../types';

export interface ClientLogoOption {
  id: Exclude<ClientLogoId, 'custom'>;
  label: string;
  src: string | null;
}

export const CLIENT_LOGO_OPTIONS: ClientLogoOption[] = [
  { id: 'none', label: 'Без логотипа', src: null },
  { id: 'vzlp', label: 'ВЗЛП', src: `${import.meta.env.BASE_URL}logos/clients/vzlp.svg` },
  { id: 'gazprom', label: 'Газпром', src: `${import.meta.env.BASE_URL}logos/clients/gazprom.svg` },
  { id: 'rosatom', label: 'Росатом', src: `${import.meta.env.BASE_URL}logos/clients/rosatom.svg` },
];

export const AVERS_LOGO_ICON = `${import.meta.env.BASE_URL}logos/logo-avers-icon.png`;
export const AVERS_LOGO = `${import.meta.env.BASE_URL}logos/logo-avers-new.png`;
export const AVERS_LOGO_WHITE = `${import.meta.env.BASE_URL}logos/logo-avers-new_white.png`;

export function resolveClientLogoSrc(
  logoId: ClientLogoId = 'none',
  customDataUrl?: string | null
): string | null {
  if (logoId === 'none') return null;
  if (logoId === 'custom') return customDataUrl || null;
  return CLIENT_LOGO_OPTIONS.find((o) => o.id === logoId)?.src ?? null;
}

export function resolveEstimateClientLogo(estimate: Estimate): string | null {
  return resolveClientLogoSrc(estimate.clientLogoId ?? 'none', estimate.clientLogoCustom);
}
