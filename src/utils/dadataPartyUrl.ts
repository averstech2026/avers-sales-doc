/** Локально — Vite-прокси; в проде — Cloud Function (VITE_DADATA_PARTY_URL). */
export function resolveDadataPartyUrl(): string | null {
  const configured = import.meta.env.VITE_DADATA_PARTY_URL?.trim();
  if (configured) return configured;

  if (import.meta.env.DEV) {
    return '/api/dadata/party';
  }

  return null;
}

export function isDadataPartyConfigured(): boolean {
  return resolveDadataPartyUrl() !== null;
}
