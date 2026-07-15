import type { AiParseResult, RoleHours } from '../types';
import { EMPTY_HOURS } from '../constants/roles';
import { resolveYandexParseUrl } from './yandexParseUrl';

interface KeywordRule {
  keywords: string[];
  sectionName: string;
  tasks: Array<{
    name: string;
    description: string;
    hours: Partial<RoleHours>;
  }>;
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    keywords: ['база данных', 'postgresql', 'mysql', 'бд', 'хранение данных', 'миграци'],
    sectionName: 'Проектирование и разработка базы данных',
    tasks: [
      { name: 'Проектирование схемы БД', description: 'ER-диаграмма, нормализация', hours: { architect: 8, backend: 4 } },
      { name: 'Реализация и миграции', description: 'Создание таблиц, индексов, миграций', hours: { backend: 24 } },
    ],
  },
  {
    keywords: ['личный кабинет', 'лк', 'профиль пользователя', 'авторизация', 'аутентификация', 'регистрация'],
    sectionName: 'Личный кабинет и авторизация',
    tasks: [
      { name: 'UI личного кабинета', description: 'Страницы профиля, настроек', hours: { designer: 12, frontend: 24 } },
      { name: 'Backend авторизации', description: 'JWT/OAuth, роли, сессии', hours: { backend: 20, architect: 4 } },
    ],
  },
  {
    keywords: ['api', 'интеграция', '1с', 'внешн', 'webhook', 'rest', 'soap'],
    sectionName: 'Интеграция с внешними системами',
    tasks: [
      { name: 'Проектирование API', description: 'Спецификация, контракты', hours: { architect: 8, consultant: 4 } },
      { name: 'Реализация интеграции', description: 'Обмен данными, обработка ошибок', hours: { backend: 32, engineer: 8 } },
    ],
  },
  {
    keywords: ['админ', 'панель управления', 'администратор', 'cms', 'управление'],
    sectionName: 'Административная панель',
    tasks: [
      { name: 'Проектирование админ-панели', description: 'UX-схемы, роли доступа', hours: { consultant: 8, designer: 16 } },
      { name: 'Разработка админ-панели', description: 'CRUD, отчёты, фильтры', hours: { frontend: 40, backend: 32 } },
    ],
  },
  {
    keywords: ['отчёт', 'отчет', 'аналитик', 'дашборд', 'статистик', 'график'],
    sectionName: 'Отчётность и аналитика',
    tasks: [
      { name: 'Проектирование отчётов', description: 'Требования к метрикам', hours: { consultant: 8 } },
      { name: 'Разработка отчётов', description: 'Визуализация, экспорт', hours: { frontend: 24, backend: 16 } },
    ],
  },
  {
    keywords: ['мобильн', 'адаптив', 'responsive', 'планшет', 'смартфон'],
    sectionName: 'Адаптивная вёрстка',
    tasks: [
      { name: 'Адаптивный дизайн', description: 'Макеты для всех разрешений', hours: { designer: 20 } },
      { name: 'Адаптивная вёрстка', description: 'Реализация responsive UI', hours: { frontend: 24 } },
    ],
  },
  {
    keywords: ['касс', 'оплат', 'платёж', 'платеж', 'эквайринг', 'чек', 'фискал'],
    sectionName: 'Платёжный модуль',
    tasks: [
      { name: 'Интеграция платёжного шлюза', description: 'Эквайринг, фискализация', hours: { backend: 24, architect: 8 } },
      { name: 'UI оплаты', description: 'Экран оплаты, статусы', hours: { frontend: 16, designer: 8 } },
    ],
  },
  {
    keywords: ['распознаван', 'нейросет', 'ai', 'машинн', 'компьютерн', 'vision', 'камер'],
    sectionName: 'Модуль машинного зрения / AI',
    tasks: [
      { name: 'Исследование ML-решения', description: 'Выбор модели, PoC', hours: { architect: 16, engineer: 16 } },
      { name: 'Интеграция распознавания', description: 'API inference, обучение', hours: { backend: 32, engineer: 24 } },
    ],
  },
  {
    keywords: ['терминал', 'киоск', 'самообслуж', 'ксо', 'touch'],
    sectionName: 'Терминал самообслуживания',
    tasks: [
      { name: 'UI терминала', description: 'Touch-интерфейс, навигация', hours: { designer: 24, frontend: 40 } },
      { name: 'Интеграция оборудования', description: 'Принтер, сканер, POS', hours: { engineer: 24, backend: 16 } },
    ],
  },
  {
    keywords: ['тестирован', 'qa', 'автотест', 'нагрузочн'],
    sectionName: 'Тестирование и внедрение',
    tasks: [
      { name: 'Функциональное тестирование', description: 'Тест-кейсы, регресс', hours: { engineer: 24 } },
      { name: 'Развёртывание', description: 'CI/CD, мониторинг', hours: { engineer: 16, backend: 8 } },
    ],
  },
];

function matchRules(text: string): KeywordRule[] {
  const lower = text.toLowerCase();
  return KEYWORD_RULES.filter((rule) =>
    rule.keywords.some((kw) => lower.includes(kw))
  );
}

function buildFromRules(rules: KeywordRule[]): AiParseResult {
  return {
    sections: rules.map((rule) => ({
      name: rule.sectionName,
      tasks: rule.tasks.map((t) => ({
        name: t.name,
        description: t.description,
        hours: { ...EMPTY_HOURS(), ...t.hours },
      })),
    })),
  };
}

async function parseWithYandex(text: string): Promise<AiParseResult | null> {
  const apiUrl = resolveYandexParseUrl();
  if (!apiUrl) return null;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const result = data.result as AiParseResult | undefined;
    if (!result?.sections?.length) return null;
    return result;
  } catch {
    return null;
  }
}

async function parseWithOpenAI(text: string): Promise<AiParseResult | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Ты — аналитик IT-проектов. Разбери ТЗ заказчика на этапы сметы разработки ПО.
Верни JSON: { "sections": [{ "name": "название этапа", "tasks": [{ "name": "задача", "description": "описание", "hours": { "consultant": 0, "architect": 0, "backend": 0, "frontend": 0, "engineer": 0, "designer": 0 } }] }] }
Часы — реалистичные оценки. Роли: consultant, architect, backend, frontend, engineer, designer.`,
          },
          { role: 'user', content: text },
        ],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content) as AiParseResult;
  } catch {
    return null;
  }
}

export async function parseTechnicalSpec(text: string): Promise<{
  result: AiParseResult;
  source: 'ai' | 'rules';
  provider?: 'yandex' | 'openai';
  yandexConfigured: boolean;
  yandexFailed: boolean;
}> {
  const trimmed = text.trim();
  const yandexConfigured = resolveYandexParseUrl() !== null;

  if (!trimmed) {
    return { result: { sections: [] }, source: 'rules', yandexConfigured, yandexFailed: false };
  }

  const yandexResult = await parseWithYandex(trimmed);
  if (yandexResult && yandexResult.sections?.length > 0) {
    return { result: yandexResult, source: 'ai', provider: 'yandex', yandexConfigured, yandexFailed: false };
  }

  const yandexFailed = yandexConfigured;

  const openAiResult = await parseWithOpenAI(trimmed);
  if (openAiResult && openAiResult.sections?.length > 0) {
    return { result: openAiResult, source: 'ai', provider: 'openai', yandexConfigured, yandexFailed };
  }

  const matched = matchRules(trimmed);
  if (matched.length > 0) {
    return { result: buildFromRules(matched), source: 'rules', yandexConfigured, yandexFailed };
  }

  return {
    result: {
      sections: [
        {
          name: '3. Разработка по ТЗ заказчика',
          tasks: [
            {
              name: 'Анализ и декомпозиция требований',
              description: trimmed.slice(0, 200) + (trimmed.length > 200 ? '…' : ''),
              hours: { consultant: 16, architect: 12 },
            },
            {
              name: 'Реализация функционала',
              description: 'Разработка по согласованному ТЗ',
              hours: { backend: 40, frontend: 40, designer: 16 },
            },
            {
              name: 'Тестирование и внедрение',
              description: 'Приёмочное тестирование, развёртывание',
              hours: { engineer: 24 },
            },
          ],
        },
      ],
    },
    source: 'rules',
    yandexConfigured,
    yandexFailed,
  };
}
