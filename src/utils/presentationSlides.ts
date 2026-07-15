export type PresentationSlideId = 'about' | 'recognition' | 'kiosk';

/** Editable content of one KP slide (same layout for all slides). */
export interface PresentationSlideContent {
  title: string;
  /** Highlight badge under the title; empty hides the block */
  badge: string;
  disclaimer: string;
  subtitle: string;
  /** Newline-separated bullet items; takes priority over `body` when non-empty */
  bulletsText: string;
  /** Paragraph body when there are no bullets */
  body: string;
  /** Caption next to QR; empty hides the QR block */
  qrCaption: string;
  imageDataUrl: string | null;
  qrImageDataUrl: string | null;
}

export interface PresentationSlidesLibrary {
  about: PresentationSlideContent;
  recognition: PresentationSlideContent;
  kiosk: PresentationSlideContent;
  updatedAt?: string;
  updatedByUid?: string;
  updatedByName?: string;
}

export interface PresentationSlideDef {
  id: PresentationSlideId;
  menuTitle: string;
  menuDescription: string;
  defaultImageFile: string;
  defaultQrFile?: string;
}

export const PRESENTATION_SLIDES_SETTINGS_DOC = 'presentation_slides';

export const PRESENTATION_SLIDE_DEFS: PresentationSlideDef[] = [
  {
    id: 'about',
    menuTitle: 'О компании',
    menuDescription: 'Команда, экспертиза и ключевые решения Аверс Технолоджи.',
    defaultImageFile: 'dev-team.png',
  },
  {
    id: 'recognition',
    menuTitle: 'Распознавание еды',
    menuDescription: 'Умная касса на базе компьютерного зрения.',
    defaultImageFile: 'smart-kassa.png',
    defaultQrFile: 'qr-video.png',
  },
  {
    id: 'kiosk',
    menuTitle: 'Терминал самообслуживания',
    menuDescription: 'Интерактивный киоск заказа «как в Макдоналдс».',
    defaultImageFile: 'self-service-kiosk.png',
  },
];

export function defaultSlideAssetUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}assets/slides/${fileName}`;
}

export function createDefaultSlideContent(id: PresentationSlideId): PresentationSlideContent {
  if (id === 'recognition') {
    return {
      title: 'Система распознавания еды',
      badge:
        'Основано на принципах машинного зрения и алгоритмах искусственного интеллекта (AI)',
      disclaimer:
        '*Обратите внимание: внешний вид интерфейса и конкретные модели оборудования могут отличаться от представленных в КП.',
      subtitle: 'Умная касса',
      bulletsText: [
        'сокращает расходы на содержание кассовых точек',
        'исключает мошенничество и ошибки кассира при обслуживании клиента',
        'не берет больничный и не просит повышения зарплаты',
        'скорость распознавания менее 1 сек.',
        'точность распознавания 99,9%',
      ].join('\n'),
      body: '',
      qrCaption: 'Отсканируйте QR-код, чтобы посмотреть видео работы умной кассы:',
      imageDataUrl: null,
      qrImageDataUrl: null,
    };
  }

  if (id === 'kiosk') {
    return {
      title: 'Терминал самообслуживания',
      badge: '',
      disclaimer:
        '*Обратите внимание: внешний вид интерфейса и конкретные модели оборудования могут отличаться от представленных в КП.',
      subtitle: '«Как в Макдоналдс»',
      bulletsText: '',
      body:
        'Интерактивный терминал самообслуживания позволяет гостям самостоятельно выбирать блюда, формировать заказ и оплачивать его без участия кассира. Решение ускоряет обслуживание в часы пик, снижает очередь и повышает удобство для посетителей столовых и ритейла.',
      qrCaption: '',
      imageDataUrl: null,
      qrImageDataUrl: null,
    };
  }

  return {
    title: 'Команда разработки Аверс Технолоджи',
    badge: '',
    disclaimer:
      'Наша компания специализируется на разработке информационных систем для сферы общепита и автоматизации ритейла. Мы обладаем глубокой экспертизой и готовы реализовать проект любой сложности.',
    subtitle: 'Наши решения:',
    bulletsText: [
      'Кассовый модуль для кассиров',
      'Личный кабинет гостя',
      'WEB-приложение для заказа обедов',
      'Централизованное управление сетью предприятий',
      'Система распознавания еды в столовой',
      'Магазин самообслуживания',
      'Валидатор получения дотаций персонала',
      'Интерактивный киоск как «Макдоналдс»',
      'Интерактивное QR-меню',
      'Система анализа обратной связи гостей на основе ИИ',
    ].join('\n'),
    body: '',
    qrCaption: '',
    imageDataUrl: null,
    qrImageDataUrl: null,
  };
}

export function createDefaultSlidesLibrary(): PresentationSlidesLibrary {
  return {
    about: createDefaultSlideContent('about'),
    recognition: createDefaultSlideContent('recognition'),
    kiosk: createDefaultSlideContent('kiosk'),
  };
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export function normalizeSlideContent(
  id: PresentationSlideId,
  raw?: Partial<PresentationSlideContent> | null
): PresentationSlideContent {
  const base = createDefaultSlideContent(id);
  if (!raw) return base;
  return {
    title: asString(raw.title, base.title),
    badge: asString(raw.badge, base.badge),
    disclaimer: asString(raw.disclaimer, base.disclaimer),
    subtitle: asString(raw.subtitle, base.subtitle),
    bulletsText: asString(raw.bulletsText, base.bulletsText),
    body: asString(raw.body, base.body),
    qrCaption: asString(raw.qrCaption, base.qrCaption),
    imageDataUrl: raw.imageDataUrl === undefined ? base.imageDataUrl : asNullableString(raw.imageDataUrl),
    qrImageDataUrl:
      raw.qrImageDataUrl === undefined ? base.qrImageDataUrl : asNullableString(raw.qrImageDataUrl),
  };
}

/** Migrate legacy image-only settings document into full slide library. */
export function normalizeSlidesLibrary(raw: Record<string, unknown> | null): PresentationSlidesLibrary {
  const defaults = createDefaultSlidesLibrary();
  if (!raw) return defaults;

  const slidesRaw = (raw.slides as Record<string, unknown> | undefined) ?? raw;

  const about = normalizeSlideContent(
    'about',
    (slidesRaw.about as Partial<PresentationSlideContent> | undefined) ?? undefined
  );
  const recognition = normalizeSlideContent(
    'recognition',
    (slidesRaw.recognition as Partial<PresentationSlideContent> | undefined) ?? undefined
  );
  const kiosk = normalizeSlideContent(
    'kiosk',
    (slidesRaw.kiosk as Partial<PresentationSlideContent> | undefined) ?? undefined
  );

  // Legacy flat image fields
  if (!about.imageDataUrl && typeof raw.aboutImageDataUrl === 'string') {
    about.imageDataUrl = asNullableString(raw.aboutImageDataUrl);
  }
  if (!recognition.imageDataUrl && typeof raw.recognitionImageDataUrl === 'string') {
    recognition.imageDataUrl = asNullableString(raw.recognitionImageDataUrl);
  }
  if (!recognition.qrImageDataUrl && typeof raw.qrImageDataUrl === 'string') {
    recognition.qrImageDataUrl = asNullableString(raw.qrImageDataUrl);
  }

  return {
    about,
    recognition,
    kiosk,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
    updatedByUid: typeof raw.updatedByUid === 'string' ? raw.updatedByUid : undefined,
    updatedByName: typeof raw.updatedByName === 'string' ? raw.updatedByName : undefined,
  };
}

export function parseBulletLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[•\-\*]\s*/, '').trim())
    .filter(Boolean);
}

export function resolveSlideImageSrc(
  slide: PresentationSlideContent,
  id: PresentationSlideId
): string {
  if (slide.imageDataUrl?.trim()) return slide.imageDataUrl;
  const def = PRESENTATION_SLIDE_DEFS.find((item) => item.id === id);
  return defaultSlideAssetUrl(def?.defaultImageFile ?? 'dev-team.png');
}

export function resolveSlideQrSrc(
  slide: PresentationSlideContent,
  id: PresentationSlideId
): string | null {
  if (!slide.qrCaption.trim()) return null;
  if (slide.qrImageDataUrl?.trim()) return slide.qrImageDataUrl;
  const def = PRESENTATION_SLIDE_DEFS.find((item) => item.id === id);
  if (def?.defaultQrFile) return defaultSlideAssetUrl(def.defaultQrFile);
  return defaultSlideAssetUrl('qr-video.png');
}

export function slideHasCustomImage(slide: PresentationSlideContent): boolean {
  return Boolean(slide.imageDataUrl?.trim());
}

const DEFAULT_MAX_PHOTO_CHARS = 280_000;
const DEFAULT_MAX_QR_CHARS = 100_000;

export interface CompressImageOptions {
  maxWidth?: number;
  /** Soft target for data URL length; function retries with stronger compression. */
  maxChars?: number;
  /** Keep PNG (useful for QR). Photos default to JPEG. */
  preferPng?: boolean;
}

/** Resize & compress image to keep Firestore docs under the 1 MiB limit. */
export function compressImageFile(
  file: File,
  maxWidthOrOptions: number | CompressImageOptions = 1100,
  quality = 0.75
): Promise<string> {
  const options: CompressImageOptions =
    typeof maxWidthOrOptions === 'number'
      ? { maxWidth: maxWidthOrOptions, maxChars: DEFAULT_MAX_PHOTO_CHARS }
      : maxWidthOrOptions;

  const maxWidth = options.maxWidth ?? 1100;
  const maxChars = options.maxChars ?? DEFAULT_MAX_PHOTO_CHARS;
  const preferPng = options.preferPng === true;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Можно загружать только изображения'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.onload = () => {
      const src = String(reader.result || '');
      const img = new Image();
      img.onerror = () => reject(new Error('Некорректный файл изображения'));
      img.onload = () => {
        const attempts: Array<{ width: number; quality: number; mime: string }> = preferPng
          ? [
              { width: Math.min(maxWidth, 400), quality: 1, mime: 'image/png' },
              { width: 320, quality: 1, mime: 'image/png' },
              { width: 256, quality: 0.92, mime: 'image/jpeg' },
              { width: 200, quality: 0.85, mime: 'image/jpeg' },
            ]
          : [
              { width: maxWidth, quality: quality || 0.75, mime: 'image/jpeg' },
              { width: Math.min(maxWidth, 1000), quality: 0.68, mime: 'image/jpeg' },
              { width: 860, quality: 0.6, mime: 'image/jpeg' },
              { width: 720, quality: 0.55, mime: 'image/jpeg' },
              { width: 640, quality: 0.5, mime: 'image/jpeg' },
              { width: 520, quality: 0.45, mime: 'image/jpeg' },
            ];

        let best: string | null = null;

        for (const attempt of attempts) {
          const scale = Math.min(1, attempt.width / Math.max(img.width, 1));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas недоступен'));
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(attempt.mime, attempt.quality);
          if (!best || dataUrl.length < best.length) best = dataUrl;
          if (dataUrl.length <= maxChars) {
            resolve(dataUrl);
            return;
          }
        }

        if (best && best.length <= maxChars * 1.15) {
          resolve(best);
          return;
        }

        reject(
          new Error(
            'Не удалось сжать изображение до допустимого размера. Попробуйте другое фото или кадр поменьше.'
          )
        );
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

export { DEFAULT_MAX_PHOTO_CHARS, DEFAULT_MAX_QR_CHARS };
