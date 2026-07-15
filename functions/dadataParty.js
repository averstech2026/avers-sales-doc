const DADATA_FIND_PARTY_URL =
  'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party';

export function normalizeInn(value) {
  return String(value || '').replace(/\D/g, '');
}

export function isValidInnLength(inn) {
  return inn.length === 10 || inn.length === 12;
}

/**
 * Map DaData party suggestion → company form fields (no bank details).
 */
export function mapPartySuggestion(suggestion) {
  const data = suggestion?.data || {};
  const name =
    data.name?.short_with_opf ||
    data.name?.full_with_opf ||
    suggestion?.value ||
    '';
  const address =
    data.address?.unrestricted_value || data.address?.value || '';

  let director = String(data.management?.name || '').trim();
  if (!director && data.fio) {
    director = [data.fio.surname, data.fio.name, data.fio.patronymic]
      .filter(Boolean)
      .join(' ');
  }

  return {
    name: String(name).trim(),
    inn: String(data.inn || '').trim(),
    kpp: String(data.kpp || '').trim(),
    ogrn: String(data.ogrn || '').trim(),
    legalAddress: String(address).trim(),
    director,
    directorBasis: 'Устава',
  };
}

export async function findPartyByInn(inn, { apiKey, secretKey } = {}) {
  const normalized = normalizeInn(inn);
  if (!isValidInnLength(normalized)) {
    throw new Error('ИНН должен содержать 10 или 12 цифр');
  }
  if (!apiKey) {
    throw new Error('DADATA_API_KEY не задан в .env');
  }

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Token ${apiKey}`,
  };
  if (secretKey) {
    headers['X-Secret'] = secretKey;
  }

  const response = await fetch(DADATA_FIND_PARTY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: normalized }),
  });

  if (!response.ok) {
    const err = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error('DaData: неверный API-ключ');
    }
    throw new Error(`DaData: ${response.status} — ${err}`);
  }

  const payload = await response.json();
  const suggestions = Array.isArray(payload.suggestions) ? payload.suggestions : [];
  if (suggestions.length === 0) {
    throw new Error('Компания с таким ИНН не найдена');
  }

  return mapPartySuggestion(suggestions[0]);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export function createDadataPartyHandler(getConfig) {
  return async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    try {
      const body =
        req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)
          ? req.body
          : await readJsonBody(req);
      const inn = String(body.inn || '').trim();

      if (!inn) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Поле inn обязательно' }));
        return;
      }

      const { apiKey, secretKey } = getConfig();
      const result = await findPartyByInn(inn, { apiKey, secretKey });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ result }));
    } catch (err) {
      const message = err.message || 'Ошибка поиска по ИНН';
      const isClient =
        message.includes('ИНН') ||
        message.includes('не найден') ||
        message.includes('не задан');
      res.statusCode = isClient ? 400 : 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: message }));
    }
  };
}
