import { isDadataPartyConfigured, resolveDadataPartyUrl } from '../utils/dadataPartyUrl';

export interface PartyLookupResult {
  name: string;
  inn: string;
  kpp: string;
  ogrn: string;
  legalAddress: string;
  director: string;
  directorBasis: string;
}

export { isDadataPartyConfigured };

export async function lookupCompanyByInn(inn: string): Promise<PartyLookupResult> {
  const url = resolveDadataPartyUrl();
  if (!url) {
    throw new Error(
      'Поиск по ИНН недоступен: задайте DADATA_API_KEY для локальной разработки или VITE_DADATA_PARTY_URL для продакшена.'
    );
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inn }),
    });
  } catch {
    const isLocalProxy = url.startsWith('/api/');
    throw new Error(
      isLocalProxy
        ? 'Не удалось связаться с локальным API. Запустите npm run dev (или ./scripts/dev-server.sh) и обновите страницу.'
        : `Не удалось связаться с сервисом поиска по ИНН (${url}). Проверьте VITE_DADATA_PARTY_URL и CORS.`
    );
  }

  const payload = (await response.json().catch(() => ({}))) as {
    result?: PartyLookupResult;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || `Ошибка поиска по ИНН (${response.status})`);
  }

  if (!payload.result?.name && !payload.result?.inn) {
    throw new Error(payload.error || 'Пустой ответ сервиса DaData');
  }

  return payload.result;
}
