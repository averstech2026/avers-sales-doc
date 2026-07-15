import type { ClientLogoId, Estimate } from '../types';

export interface ClientLogoOption {
  id: Exclude<ClientLogoId, 'custom'>;
  label: string;
  src: string | null;
}

export const CLIENT_LOGO_OPTIONS: ClientLogoOption[] = [
  { id: 'none', label: 'Без логотипа', src: null },
];

export const AVERS_LOGO_ICON = `${import.meta.env.BASE_URL}logos/logo-avers-icon.png`;
export const AVERS_LOGO = `${import.meta.env.BASE_URL}logos/logo-avers-new.png`;
export const AVERS_LOGO_WHITE = `${import.meta.env.BASE_URL}logos/logo-avers-new_white.png`;

export function normalizeClientLogoId(logoId?: string | null): ClientLogoId {
  return logoId === 'custom' ? 'custom' : 'none';
}

export function resolveClientLogoSrc(
  logoId: ClientLogoId = 'none',
  customDataUrl?: string | null
): string | null {
  if (logoId === 'custom') return customDataUrl || null;
  return null;
}

export function resolveEstimateClientLogo(estimate: Estimate): string | null {
  return resolveClientLogoSrc(normalizeClientLogoId(estimate.clientLogoId), estimate.clientLogoCustom);
}
