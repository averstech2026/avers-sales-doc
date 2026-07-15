import { findPartyByInn } from './dadataParty.js';

function corsHeaders(event) {
  const headers = event.headers || {};
  const requested =
    headers['access-control-request-headers'] ||
    headers['Access-Control-Request-Headers'];

  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': requested || 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
  };
}

function parseBody(event) {
  let raw = event.body || '';
  if (event.isBase64Encoded && raw) {
    raw = Buffer.from(raw, 'base64').toString('utf8');
  }
  return raw ? JSON.parse(raw) : {};
}

export async function handler(event) {
  const headers = corsHeaders(event);
  const method = (event.httpMethod || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = parseBody(event);
    const inn = String(body.inn || '').trim();

    if (!inn) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Поле inn обязательно' }),
      };
    }

    const result = await findPartyByInn(inn, {
      apiKey: process.env.DADATA_API_KEY,
      secretKey: process.env.DADATA_SECRET_KEY,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ result }),
    };
  } catch (err) {
    const message = err.message || 'Ошибка поиска по ИНН';
    const isClient =
      message.includes('ИНН') ||
      message.includes('не найден') ||
      message.includes('не задан');
    return {
      statusCode: isClient ? 400 : 500,
      headers,
      body: JSON.stringify({ error: message }),
    };
  }
}
