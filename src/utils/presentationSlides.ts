export type PresentationSlideId = 'about' | 'recognition' | 'kiosk' | 'contacts';

export type SlideBadgeIconId =
  | 'ai'
  | 'star'
  | 'bolt'
  | 'shield'
  | 'check'
  | 'chip'
  | 'info'
  | 'none';

export interface SlideBadgeIconOption {
  id: SlideBadgeIconId;
  label: string;
  /** Pastel squircle container class */
  containerClass: string;
  /** Native tooltip in the compact icon picker */
  pickerTitle: string;
}

export const SLIDE_BADGE_ICON_OPTIONS: SlideBadgeIconOption[] = [
  {
    id: 'none',
    label: 'Без иконки',
    containerClass: 'badge-container-none',
    pickerTitle: 'Без иконки',
  },
  {
    id: 'ai',
    label: 'AI',
    containerClass: 'badge-container-ai',
    pickerTitle: 'ИИ / Искусственный интеллект',
  },
  {
    id: 'star',
    label: 'Звезда',
    containerClass: 'badge-container-star',
    pickerTitle: 'Преимущество / Избранное',
  },
  {
    id: 'bolt',
    label: 'Энергия',
    containerClass: 'badge-container-energy',
    pickerTitle: 'Скорость / Энергия',
  },
  {
    id: 'shield',
    label: 'Модуль',
    containerClass: 'badge-container-system',
    pickerTitle: 'Интеграция / Модуль',
  },
  {
    id: 'check',
    label: 'Готово',
    containerClass: 'badge-container-success',
    pickerTitle: 'Готовое решение / Надёжность',
  },
  {
    id: 'chip',
    label: 'IoT',
    containerClass: 'badge-container-iot',
    pickerTitle: 'Интернет вещей / Оборудование',
  },
  {
    id: 'info',
    label: 'Инфо',
    containerClass: 'badge-container-info',
    pickerTitle: 'Обратите внимание',
  },
];

export function getSlideBadgeIconMeta(
  id: SlideBadgeIconId | string | undefined
): SlideBadgeIconOption {
  const found = SLIDE_BADGE_ICON_OPTIONS.find((option) => option.id === id);
  return found ?? SLIDE_BADGE_ICON_OPTIONS.find((option) => option.id === 'none')!;
}

export function normalizeBadgeIconId(
  value: unknown,
  fallback: SlideBadgeIconId = 'none'
): SlideBadgeIconId {
  if (typeof value === 'string' && SLIDE_BADGE_ICON_OPTIONS.some((option) => option.id === value)) {
    return value as SlideBadgeIconId;
  }
  return fallback;
}

export type SlideChipColorId = 'mint' | 'sky' | 'amber' | 'rose' | 'violet' | 'slate';

export interface SlideChipColorOption {
  id: SlideChipColorId;
  label: string;
  /** Soft badge background */
  background: string;
  /** Caption / badge text */
  foreground: string;
  /** QR frame accent (also used as subtle border hint) */
  accent: string;
}

export const DEFAULT_SLIDE_CHIP_COLOR: SlideChipColorId = 'mint';

export const SLIDE_CHIP_COLOR_OPTIONS: SlideChipColorOption[] = [
  {
    id: 'mint',
    label: 'Мята',
    background: '#f0fdf4',
    foreground: '#1e293b',
    accent: '#00a86b',
  },
  {
    id: 'sky',
    label: 'Небо',
    background: '#eff6ff',
    foreground: '#1e293b',
    accent: '#3b82f6',
  },
  {
    id: 'amber',
    label: 'Янтарь',
    background: '#fffbeb',
    foreground: '#1e293b',
    accent: '#f59e0b',
  },
  {
    id: 'rose',
    label: 'Роза',
    background: '#fff1f2',
    foreground: '#1e293b',
    accent: '#f43f5e',
  },
  {
    id: 'violet',
    label: 'Фиолет',
    background: '#f5f3ff',
    foreground: '#1e293b',
    accent: '#8b5cf6',
  },
  {
    id: 'slate',
    label: 'Серый',
    background: '#f1f5f9',
    foreground: '#1e293b',
    accent: '#64748b',
  },
];

export function getSlideChipColorMeta(
  id: SlideChipColorId | string | undefined
): SlideChipColorOption {
  const found = SLIDE_CHIP_COLOR_OPTIONS.find((option) => option.id === id);
  return found ?? SLIDE_CHIP_COLOR_OPTIONS.find((option) => option.id === DEFAULT_SLIDE_CHIP_COLOR)!;
}

export function normalizeSlideChipColorId(
  value: unknown,
  fallback: SlideChipColorId = DEFAULT_SLIDE_CHIP_COLOR
): SlideChipColorId {
  if (typeof value === 'string' && SLIDE_CHIP_COLOR_OPTIONS.some((option) => option.id === value)) {
    return value as SlideChipColorId;
  }
  return fallback;
}

/** CSS custom properties for top badge / bottom QR chip colors. */
export function slideChipColorVars(
  badgeColor: SlideChipColorId | string | undefined,
  qrBadgeColor: SlideChipColorId | string | undefined
): Record<string, string> {
  const badge = getSlideChipColorMeta(badgeColor);
  const qr = getSlideChipColorMeta(qrBadgeColor);
  return {
    '--slide-badge-bg': badge.background,
    '--slide-badge-fg': badge.foreground,
    '--slide-qr-badge-bg': qr.background,
    '--slide-qr-badge-fg': qr.foreground,
    '--slide-qr-badge-accent': qr.accent,
  };
}

/** Editable content of one KP slide (same layout for all slides). */
export interface PresentationSlideContent {
  title: string;
  /** Highlight badge under the title; empty hides the block */
  badge: string;
  /** Icon shown in the badge pill; `none` hides the icon */
  badgeIcon: SlideBadgeIconId;
  /** Soft background color for the top badge */
  badgeColor: SlideChipColorId;
  disclaimer: string;
  subtitle: string;
  /** Newline-separated bullet items; takes priority over `body` when non-empty */
  bulletsText: string;
  /** Paragraph body when there are no bullets */
  body: string;
  /** Caption next to QR; empty hides the QR block */
  qrCaption: string;
  /** Soft background color for the QR caption chip */
  qrBadgeColor: SlideChipColorId;
  imageDataUrl: string | null;
  qrImageDataUrl: string | null;
}

/** Final contacts slide — distinct layout (address + map + brand footer). */
export interface ContactsSlideContent {
  title: string;
  address: string;
  site: string;
  phone: string;
  email: string;
  mapImageDataUrl: string | null;
}

export type AnySlideContent = PresentationSlideContent | ContactsSlideContent;

/** User-created content slide (standard layout, not contacts). */
export interface CustomPresentationSlide {
  id: string;
  menuTitle: string;
  menuDescription: string;
  defaultImageFile: string;
  content: PresentationSlideContent;
}

export const CUSTOM_SLIDE_ID_PREFIX = 'slide_';

export interface PresentationSlidesLibrary {
  about: PresentationSlideContent;
  recognition: PresentationSlideContent;
  kiosk: PresentationSlideContent;
  contacts: ContactsSlideContent;
  customSlides?: CustomPresentationSlide[];
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
  /** Contacts slide uses a dedicated layout */
  layout?: 'standard' | 'contacts';
}

export const PRESENTATION_SLIDES_SETTINGS_DOC = 'presentation_slides';

export const PRESENTATION_SLIDE_DEFS: PresentationSlideDef[] = [
  {
    id: 'about',
    menuTitle: 'О компании',
    menuDescription: 'Команда, экспертиза и ключевые решения Аверс Технолоджи.',
    defaultImageFile: 'dev-team.jpg',
  },
  {
    id: 'recognition',
    menuTitle: 'Распознавание еды',
    menuDescription: 'Умная касса на базе компьютерного зрения.',
    defaultImageFile: 'smart-kassa.jpg',
    defaultQrFile: 'qr-video.png',
  },
  {
    id: 'kiosk',
    menuTitle: 'Терминал самообслуживания',
    menuDescription: 'Интерактивный киоск заказа «как в Макдоналдс».',
    defaultImageFile: 'self-service-kiosk.jpg',
  },
  {
    id: 'contacts',
    menuTitle: 'Контакты',
    menuDescription: 'Контакты и карта проезда — правая колонка объединённого подвала КП.',
    defaultImageFile: 'map-location.jpg',
    layout: 'contacts',
  },
];

export function isContactsSlideId(id: string): id is 'contacts' {
  return id === 'contacts';
}

export function isCustomSlideId(id: string): boolean {
  return id.startsWith(CUSTOM_SLIDE_ID_PREFIX);
}

export function createCustomSlideId(): string {
  return `${CUSTOM_SLIDE_ID_PREFIX}${Date.now()}`;
}

/** Blank standard-layout slide — base for newly created custom slides. */
export function createBlankSlideContent(): PresentationSlideContent {
  return {
    title: 'Новый слайд',
    badge: '',
    badgeIcon: 'none',
    badgeColor: DEFAULT_SLIDE_CHIP_COLOR,
    disclaimer: 'Введите краткое описание или вводный текст для этого слайда...',
    subtitle: 'Наши решения:',
    bulletsText: ['Первый пункт списка решений', 'Второй пункт списка решений'].join('\n'),
    body: '',
    qrCaption: '',
    qrBadgeColor: DEFAULT_SLIDE_CHIP_COLOR,
    imageDataUrl: null,
    qrImageDataUrl: null,
  };
}

export function createCustomSlideEntry(): CustomPresentationSlide {
  return {
    id: createCustomSlideId(),
    menuTitle: 'Новый слайд',
    menuDescription: 'Контентный слайд по стандартному шаблону.',
    defaultImageFile: 'dev-team.jpg',
    content: createBlankSlideContent(),
  };
}

export function normalizeCustomSlide(
  raw?: Partial<CustomPresentationSlide> | null
): CustomPresentationSlide | null {
  if (!raw || typeof raw.id !== 'string' || !isCustomSlideId(raw.id)) return null;
  return {
    id: raw.id,
    menuTitle: asString(raw.menuTitle, 'Новый слайд'),
    menuDescription: asString(raw.menuDescription, 'Контентный слайд по стандартному шаблону.'),
    defaultImageFile: asString(raw.defaultImageFile, 'dev-team.jpg'),
    content: normalizeSlideContent('about', raw.content ?? undefined),
  };
}

export function isContactsContent(content: AnySlideContent): content is ContactsSlideContent {
  return 'address' in content && 'phone' in content && 'email' in content;
}

export function defaultSlideAssetUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}assets/slides/${fileName}`;
}

export function createDefaultContactsSlideContent(): ContactsSlideContent {
  return {
    title: 'Контакты компании',
    address: 'г. Москва, Щелковское шоссе д. 5, стр. 1, офис 726.',
    site: 'https://www.averstech.ru',
    phone: '+7 (495) 215-03-47',
    email: 'mail@averstech.ru',
    mapImageDataUrl: null,
  };
}

/** Display label for site link (without protocol). */
export function formatContactsSiteLabel(site: string): string {
  return site.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

export function createDefaultSlideContent(id: Exclude<PresentationSlideId, 'contacts'>): PresentationSlideContent {
  if (id === 'recognition') {
    return {
      title: 'Система распознавания еды',
      badge:
        'Основано на принципах машинного зрения и алгоритмах искусственного интеллекта (AI)',
      badgeIcon: 'ai',
      badgeColor: DEFAULT_SLIDE_CHIP_COLOR,
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
      qrBadgeColor: DEFAULT_SLIDE_CHIP_COLOR,
      imageDataUrl: null,
      qrImageDataUrl: null,
    };
  }

  if (id === 'kiosk') {
    return {
      title: 'Терминал самообслуживания',
      badge: '',
      badgeIcon: 'none',
      badgeColor: DEFAULT_SLIDE_CHIP_COLOR,
      disclaimer:
        '*Обратите внимание: внешний вид интерфейса и конкретные модели оборудования могут отличаться от представленных в КП.',
      subtitle: '«Как в Макдоналдс»',
      bulletsText: '',
      body:
        'Интерактивный терминал самообслуживания позволяет гостям самостоятельно выбирать блюда, формировать заказ и оплачивать его без участия кассира. Решение ускоряет обслуживание в часы пик, снижает очередь и повышает удобство для посетителей столовых и ритейла.',
      qrCaption: '',
      qrBadgeColor: DEFAULT_SLIDE_CHIP_COLOR,
      imageDataUrl: null,
      qrImageDataUrl: null,
    };
  }

  return {
    title: 'Команда разработки Аверс Технолоджи',
    badge: '',
    badgeIcon: 'none',
    badgeColor: DEFAULT_SLIDE_CHIP_COLOR,
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
    qrBadgeColor: DEFAULT_SLIDE_CHIP_COLOR,
    imageDataUrl: null,
    qrImageDataUrl: null,
  };
}

export function createDefaultSlidesLibrary(): PresentationSlidesLibrary {
  return {
    about: createDefaultSlideContent('about'),
    recognition: createDefaultSlideContent('recognition'),
    kiosk: createDefaultSlideContent('kiosk'),
    contacts: createDefaultContactsSlideContent(),
    customSlides: [],
  };
}

/** Default KP constructor checkboxes for a new estimate (contacts on). */
export function createDefaultPresentationSlidesSelection(): {
  about: boolean;
  recognition: boolean;
  kiosk: boolean;
  contacts: boolean;
  customIds: string[];
} {
  return { about: false, recognition: false, kiosk: false, contacts: true, customIds: [] };
}

/** Normalize estimate KP slide selection (built-ins + custom ids). */
export function normalizePresentationSlidesSelection(
  raw?: {
    about?: boolean;
    recognition?: boolean;
    kiosk?: boolean;
    contacts?: boolean;
    customIds?: unknown;
  } | null
): {
  about: boolean;
  recognition: boolean;
  kiosk: boolean;
  contacts: boolean;
  customIds: string[];
} {
  const customIds = Array.isArray(raw?.customIds)
    ? [
        ...new Set(
          raw.customIds.filter(
            (id): id is string => typeof id === 'string' && isCustomSlideId(id)
          )
        ),
      ]
    : [];

  return {
    about: raw?.about === true,
    recognition: raw?.recognition === true,
    kiosk: raw?.kiosk === true,
    contacts: raw?.contacts === true,
    customIds,
  };
}

export function hasAnyPresentationSlideSelected(
  slides?: {
    about?: boolean;
    recognition?: boolean;
    kiosk?: boolean;
    contacts?: boolean;
    customIds?: string[];
  } | null
): boolean {
  if (!slides) return false;
  return (
    slides.about === true ||
    slides.recognition === true ||
    slides.kiosk === true ||
    slides.contacts === true ||
    (slides.customIds?.length ?? 0) > 0
  );
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export function normalizeSlideContent(
  id: Exclude<PresentationSlideId, 'contacts'>,
  raw?: Partial<PresentationSlideContent> | null
): PresentationSlideContent {
  const base = createDefaultSlideContent(id);
  if (!raw) return base;
  return {
    title: asString(raw.title, base.title),
    badge: asString(raw.badge, base.badge),
    badgeIcon: normalizeBadgeIconId(raw.badgeIcon, base.badgeIcon),
    badgeColor: normalizeSlideChipColorId(raw.badgeColor, base.badgeColor),
    disclaimer: asString(raw.disclaimer, base.disclaimer),
    subtitle: asString(raw.subtitle, base.subtitle),
    bulletsText: asString(raw.bulletsText, base.bulletsText),
    body: asString(raw.body, base.body),
    qrCaption: asString(raw.qrCaption, base.qrCaption),
    qrBadgeColor: normalizeSlideChipColorId(raw.qrBadgeColor, base.qrBadgeColor),
    imageDataUrl: raw.imageDataUrl === undefined ? base.imageDataUrl : asNullableString(raw.imageDataUrl),
    qrImageDataUrl:
      raw.qrImageDataUrl === undefined ? base.qrImageDataUrl : asNullableString(raw.qrImageDataUrl),
  };
}

export function normalizeContactsSlideContent(
  raw?: Partial<ContactsSlideContent> | null
): ContactsSlideContent {
  const base = createDefaultContactsSlideContent();
  if (!raw) return base;
  return {
    title: asString(raw.title, base.title),
    address: asString(raw.address, base.address),
    site: asString(raw.site, base.site),
    phone: asString(raw.phone, base.phone),
    email: asString(raw.email, base.email),
    mapImageDataUrl:
      raw.mapImageDataUrl === undefined ? base.mapImageDataUrl : asNullableString(raw.mapImageDataUrl),
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
  const contacts = normalizeContactsSlideContent(
    (slidesRaw.contacts as Partial<ContactsSlideContent> | undefined) ?? undefined
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

  const customSlidesRaw = slidesRaw.customSlides;
  const customSlides = Array.isArray(customSlidesRaw)
    ? customSlidesRaw
        .map((item) => normalizeCustomSlide(item as Partial<CustomPresentationSlide>))
        .filter((item): item is CustomPresentationSlide => item !== null)
    : [];

  return {
    about,
    recognition,
    kiosk,
    contacts,
    customSlides,
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
  id: Exclude<PresentationSlideId, 'contacts'> | string,
  defaultImageFile?: string
): string {
  if (slide.imageDataUrl?.trim()) return slide.imageDataUrl;
  if (defaultImageFile) return defaultSlideAssetUrl(defaultImageFile);
  const def = PRESENTATION_SLIDE_DEFS.find((item) => item.id === id);
  return defaultSlideAssetUrl(def?.defaultImageFile ?? 'dev-team.jpg');
}

export function resolveContactsMapSrc(slide: ContactsSlideContent): string {
  if (slide.mapImageDataUrl?.trim()) return slide.mapImageDataUrl;
  return defaultSlideAssetUrl('map-location.jpg');
}

export function resolveSlideQrSrc(
  slide: PresentationSlideContent,
  id: Exclude<PresentationSlideId, 'contacts'> | string
): string | null {
  if (!slide.qrCaption.trim()) return null;
  if (slide.qrImageDataUrl?.trim()) return slide.qrImageDataUrl;
  const def = PRESENTATION_SLIDE_DEFS.find((item) => item.id === id);
  if (def?.defaultQrFile) return defaultSlideAssetUrl(def.defaultQrFile);
  return defaultSlideAssetUrl('qr-video.png');
}

export function slideHasCustomImage(slide: AnySlideContent): boolean {
  if (isContactsContent(slide)) {
    return Boolean(slide.mapImageDataUrl?.trim());
  }
  return Boolean(slide.imageDataUrl?.trim());
}

export function phoneToTelHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return `tel:${digits.startsWith('+') ? digits : `+${digits}`}`;
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
