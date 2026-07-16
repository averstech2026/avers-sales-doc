import {
  createBlankSlideContent,
  createDefaultSlideContent,
  isCustomSlideId,
  normalizeBadgeIconId,
  type PresentationSlideContent,
  type PresentationSlideId,
  type SlideBadgeIconId,
} from './presentationSlides';

/** Text + badge icon snapshot for a slide variant (images/colors not included). */
export interface SlideTextPresetPayload {
  title: string;
  badge: string;
  badgeIcon: SlideBadgeIconId;
  disclaimer: string;
  subtitle: string;
  body: string;
  bulletsText: string;
  qrCaption: string;
}

export interface SlideTextPreset {
  id: string;
  name: string;
  texts: SlideTextPresetPayload;
  createdAt: string;
}

export const DEFAULT_PRESET_ID = 'default';

function storageKey(slideId: string): string {
  return `slide_presets_${slideId}`;
}

export function extractSlideTextPreset(content: PresentationSlideContent): SlideTextPresetPayload {
  return {
    title: content.title,
    badge: content.badge,
    badgeIcon: content.badgeIcon,
    disclaimer: content.disclaimer,
    subtitle: content.subtitle,
    body: content.body,
    bulletsText: content.bulletsText,
    qrCaption: content.qrCaption,
  };
}

export function applySlideTextPreset(
  content: PresentationSlideContent,
  texts: SlideTextPresetPayload
): PresentationSlideContent {
  return {
    ...content,
    title: texts.title,
    badge: texts.badge,
    badgeIcon: normalizeBadgeIconId(texts.badgeIcon, content.badgeIcon),
    disclaimer: texts.disclaimer,
    subtitle: texts.subtitle,
    body: texts.body,
    bulletsText: texts.bulletsText,
    qrCaption: texts.qrCaption,
  };
}

export function getDefaultSlideTextPreset(
  slideId: Exclude<PresentationSlideId, 'contacts'> | string
): SlideTextPresetPayload {
  const base = isCustomSlideId(slideId)
    ? createBlankSlideContent()
    : createDefaultSlideContent(slideId as Exclude<PresentationSlideId, 'contacts'>);
  return extractSlideTextPreset(base);
}

function normalizePreset(raw: unknown): SlideTextPreset | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Partial<SlideTextPreset>;
  if (typeof item.id !== 'string' || typeof item.name !== 'string' || !item.texts) return null;
  const texts = item.texts as Partial<SlideTextPresetPayload>;
  return {
    id: item.id,
    name: item.name.trim() || 'Вариант',
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    texts: {
      title: typeof texts.title === 'string' ? texts.title : '',
      badge: typeof texts.badge === 'string' ? texts.badge : '',
      badgeIcon: normalizeBadgeIconId(texts.badgeIcon, 'none'),
      disclaimer: typeof texts.disclaimer === 'string' ? texts.disclaimer : '',
      subtitle: typeof texts.subtitle === 'string' ? texts.subtitle : '',
      body: typeof texts.body === 'string' ? texts.body : '',
      bulletsText: typeof texts.bulletsText === 'string' ? texts.bulletsText : '',
      qrCaption: typeof texts.qrCaption === 'string' ? texts.qrCaption : '',
    },
  };
}

export function loadSlideTextPresets(slideId: string): SlideTextPreset[] {
  try {
    const raw = localStorage.getItem(storageKey(slideId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizePreset).filter((item): item is SlideTextPreset => Boolean(item));
  } catch {
    return [];
  }
}

export function saveSlideTextPresets(slideId: string, presets: SlideTextPreset[]): void {
  localStorage.setItem(storageKey(slideId), JSON.stringify(presets));
}

export function createSlideTextPresetId(): string {
  return `preset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
