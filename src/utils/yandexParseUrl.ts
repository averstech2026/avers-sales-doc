/** Локально — Vite-прокси; в проде — Yandex Cloud Functions (VITE_YANDEX_PARSE_URL). */
export function resolveYandexParseUrl(): string | null {
  const configured = import.meta.env.VITE_YANDEX_PARSE_URL?.trim();
  if (configured) return configured;

  if (import.meta.env.DEV) {
    return '/api/yandex/parse';
  }

  return null;
}

export function isYandexParseConfigured(): boolean {
  return resolveYandexParseUrl() !== null;
}
