import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb, isFirebaseConfigured } from '../firebase';
import { COLLECTIONS } from '../constants/roles';
import {
  DEFAULT_THEME_COLORS,
  ORG_SETTINGS_KEY,
  THEME_COLORS_KEY,
  THEME_PRESETS_KEY,
  applyThemeColors,
  createThemePresetId,
  loadCustomThemePresets,
  loadOrgSettings,
  loadThemeColors,
  normalizeOrgSettings,
  normalizeThemeColors,
  type OrgSettings,
  type ThemeColors,
  type ThemePreset,
} from '../utils/personalization';

export const PERSONALIZATION_SETTINGS_DOC = 'personalization';

export interface PersonalizationSettings {
  theme: ThemeColors;
  organization: OrgSettings;
  customPresets: ThemePreset[];
  updatedAt?: string;
  updatedByUid?: string | null;
  updatedByName?: string | null;
}

export interface PersonalizationSaveMeta {
  uid?: string;
  name?: string;
}

function normalizeCustomPresets(raw: unknown): ThemePreset[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : createThemePresetId(),
      name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : 'Без названия',
      builtin: false,
      colors: normalizeThemeColors((item.colors as Partial<ThemeColors>) ?? {}),
    }))
    .slice(0, 50);
}

export function normalizePersonalizationSettings(
  raw: Record<string, unknown> | null | undefined
): PersonalizationSettings {
  return {
    theme: normalizeThemeColors((raw?.theme as Partial<ThemeColors>) ?? {}),
    organization: normalizeOrgSettings((raw?.organization as Partial<OrgSettings>) ?? {}),
    customPresets: normalizeCustomPresets(raw?.customPresets),
    updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : undefined,
    updatedByUid:
      typeof raw?.updatedByUid === 'string' || raw?.updatedByUid === null
        ? (raw.updatedByUid as string | null)
        : undefined,
    updatedByName:
      typeof raw?.updatedByName === 'string' || raw?.updatedByName === null
        ? (raw.updatedByName as string | null)
        : undefined,
  };
}

export function getLocalPersonalizationSettings(): PersonalizationSettings {
  return {
    theme: loadThemeColors(),
    organization: loadOrgSettings(),
    customPresets: loadCustomThemePresets(),
  };
}

export function cachePersonalizationSettingsLocal(settings: PersonalizationSettings): void {
  const theme = normalizeThemeColors(settings.theme);
  const organization = normalizeOrgSettings(settings.organization);
  const customPresets = normalizeCustomPresets(settings.customPresets);

  localStorage.setItem(THEME_COLORS_KEY, JSON.stringify(theme));
  localStorage.setItem(ORG_SETTINGS_KEY, JSON.stringify(organization));
  localStorage.setItem(
    THEME_PRESETS_KEY,
    JSON.stringify(
      customPresets.map((preset) => ({
        id: preset.id,
        name: preset.name,
        colors: normalizeThemeColors(preset.colors),
      }))
    )
  );
  applyThemeColors(theme);
}

function hasMeaningfulLocalData(settings: PersonalizationSettings): boolean {
  const themeChanged = JSON.stringify(settings.theme) !== JSON.stringify(DEFAULT_THEME_COLORS);
  const orgFilled = Object.entries(settings.organization).some(([key, value]) => {
    if (key === 'logoDataUrl') return typeof value === 'string' && value.length > 0;
    return typeof value === 'string' && value.trim().length > 0;
  });
  return themeChanged || orgFilled || settings.customPresets.length > 0;
}

export async function loadPersonalizationSettings(): Promise<PersonalizationSettings | null> {
  if (!isFirebaseConfigured()) {
    return getLocalPersonalizationSettings();
  }

  try {
    const db = getDb();
    const snap = await getDoc(doc(db, COLLECTIONS.settings, PERSONALIZATION_SETTINGS_DOC));
    if (!snap.exists()) return null;
    return normalizePersonalizationSettings(snap.data() as Record<string, unknown>);
  } catch {
    return getLocalPersonalizationSettings();
  }
}

export async function savePersonalizationSettings(
  settings: PersonalizationSettings,
  meta?: PersonalizationSaveMeta
): Promise<PersonalizationSettings> {
  const now = new Date().toISOString();
  const next: PersonalizationSettings = {
    theme: normalizeThemeColors(settings.theme),
    organization: normalizeOrgSettings(settings.organization),
    customPresets: normalizeCustomPresets(settings.customPresets),
    updatedAt: now,
    updatedByUid: meta?.uid ?? null,
    updatedByName: meta?.name ?? null,
  };

  cachePersonalizationSettingsLocal(next);

  if (!isFirebaseConfigured()) {
    return next;
  }

  const db = getDb();
  await setDoc(doc(db, COLLECTIONS.settings, PERSONALIZATION_SETTINGS_DOC), {
    theme: next.theme,
    organization: next.organization,
    customPresets: next.customPresets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      colors: preset.colors,
    })),
    updatedAt: next.updatedAt,
    updatedByUid: next.updatedByUid,
    updatedByName: next.updatedByName,
  });

  return next;
}

/**
 * Loads remote settings; if missing, migrates localStorage → Firestore once.
 */
export async function syncPersonalizationSettings(
  meta?: PersonalizationSaveMeta
): Promise<PersonalizationSettings> {
  const remote = await loadPersonalizationSettings();
  if (remote) {
    cachePersonalizationSettingsLocal(remote);
    return remote;
  }

  const local = getLocalPersonalizationSettings();
  if (hasMeaningfulLocalData(local) && isFirebaseConfigured()) {
    return savePersonalizationSettings(local, meta);
  }

  cachePersonalizationSettingsLocal(local);
  return local;
}
