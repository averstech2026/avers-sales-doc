const SYSTEM_PROMPT = `Ты — аналитик IT-проектов. Разбери ТЗ заказчика на этапы сметы разработки ПО.
Верни JSON: { "sections": [{ "name": "название этапа", "tasks": [{ "name": "задача", "description": "описание", "hours": { "consultant": 0, "architect": 0, "backend": 0, "frontend": 0, "engineer": 0, "designer": 0 } }] }] }
Часы — реалистичные оценки. Роли: consultant, architect, backend, frontend, engineer, designer.
Выводи только чистый JSON-объект, без markdown-разметки и пояснений.`;

const YANDEX_COMPLETION_URL =
  'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';

export function parseYandexJsonResponse(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('YandexGPT вернул некорректный формат');
  }

  return parsed;
}

export async function callYandexGpt(userText, { apiKey, folderId } = {}) {
  if (!apiKey) {
    throw new Error('YANDEX_API_KEY не задан в .env');
  }
  if (!folderId) {
    throw new Error('YANDEX_FOLDER_ID не задан в .env');
  }

  const response = await fetch(YANDEX_COMPLETION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Api-Key ${apiKey}`,
      'x-folder-id': folderId,
    },
    body: JSON.stringify({
      modelUri: `gpt://${folderId}/yandexgpt/latest`,
      completionOptions: {
        stream: false,
        temperature: 0.3,
        maxTokens: '4000',
      },
      messages: [
        { role: 'system', text: SYSTEM_PROMPT },
        { role: 'user', text: userText },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`YandexGPT: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const content = data.result?.alternatives?.[0]?.message?.text?.trim();

  if (!content) {
    throw new Error('Пустой ответ от YandexGPT');
  }

  return parseYandexJsonResponse(content);
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

export function createYandexParseHandler(getConfig) {
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
      const text = String(body.text || '').trim();

      if (!text) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Поле text обязательно' }));
        return;
      }

      const { apiKey, folderId } = getConfig();
      const result = await callYandexGpt(text, { apiKey, folderId });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ result }));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Ошибка разбора ТЗ' }));
    }
  };
}
