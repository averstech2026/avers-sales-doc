export interface ThemeColors {
  sidebarBg: string;
  sidebarActive: string;
  sidebarText: string;
  sidebarBrandOpacity: number;
  sidebarLinkOpacity: number;
  sidebarGroupOpacity: number;
  /** Accent red — icons, rules, slide edit */
  button: string;
  tableHeader: string;
  highlightBg: string;
  /** Green — «Создать КП» / сохранить в облако */
  saveButton: string;
  /** Blue — «Создать смету» (проектная) */
  createProject: string;
  cornersAccent: string;
  cornersNeutral: string;
  uiPrimaryText: string;
  uiSecondaryBg: string;
  uiSecondaryBorder: string;
  uiSecondaryText: string;
  uiDangerBg: string;
  uiDangerText: string;
  /** Slide card «Редактировать» */
  slideEditBg: string;
  /** Slide card «Просмотр» */
  slideViewBg: string;
  slideViewText: string;
  slideViewBorder: string;
  /** Dividers / separators */
  divider: string;
  /** Card action icons (mute) */
  actionMute: string;
  uiBorderRadius: number;
  uiInputHeight: number;
  uiInputFocus: string;
}

export interface OrgSettings {
  inn: string;
  ogrn: string;
  kpp: string;
  fullName: string;
  legalAddress: string;
  bankAccount: string;
  bik: string;
  bankName: string;
  logoDataUrl: string | null;
}

export const THEME_COLORS_KEY = 'avers-theme-colors';
export const ORG_SETTINGS_KEY = 'avers-org-settings';
export const THEME_PRESETS_KEY = 'avers-theme-presets';

/** @deprecated migrated to THEME_COLORS_KEY */
export const COLOR_PRIMARY_KEY = 'avers-color-primary';
/** @deprecated migrated to THEME_COLORS_KEY */
export const COLOR_ACCENT_KEY = 'avers-color-accent';

export interface ThemePreset {
  id: string;
  name: string;
  builtin?: boolean;
  colors: ThemeColors;
}

export const DEFAULT_THEME_COLORS: ThemeColors = {
  sidebarBg: '#7c818a',
  sidebarActive: '#db4040',
  sidebarText: '#ffffff',
  sidebarBrandOpacity: 100,
  sidebarLinkOpacity: 100,
  sidebarGroupOpacity: 100,
  button: '#d81818',
  tableHeader: '#7c818a',
  highlightBg: '#fceded',
  saveButton: '#10b981',
  createProject: '#2563eb',
  cornersAccent: '#d81818',
  cornersNeutral: '#1f2937',
  uiPrimaryText: '#ffffff',
  uiSecondaryBg: '#f8fafc',
  uiSecondaryBorder: '#e2e8f0',
  uiSecondaryText: '#334155',
  uiDangerBg: '#dc2626',
  uiDangerText: '#ffffff',
  slideEditBg: '#ef4444',
  slideViewBg: '#f1f5f9',
  slideViewText: '#475569',
  slideViewBorder: '#e2e8f0',
  divider: '#e2e8f0',
  actionMute: '#94a3b8',
  uiBorderRadius: 12,
  uiInputHeight: 44,
  uiInputFocus: '#7c818a',
};

export const DEFAULT_ORG_SETTINGS: OrgSettings = {
  inn: '',
  ogrn: '',
  kpp: '',
  fullName: '',
  legalAddress: '',
  bankAccount: '',
  bik: '',
  bankName: '',
  logoDataUrl: null,
};

/** Готовые цвета для быстрого выбора в персонализации */
export const THEME_COLOR_PALETTE: string[] = [
  '#7c818a',
  '#db4040',
  '#d81818',
  '#fceded',
  '#1e1b4b',
  '#3d3a6b',
  '#424044',
  '#1f2937',
  '#374151',
  '#4b5563',
  '#6b7280',
  '#9ca3af',
  '#4f46e5',
  '#4338ca',
  '#6366f1',
  '#818cf8',
  '#2563eb',
  '#3b82f6',
  '#1e3a8a',
  '#5b21b6',
  '#7c3aed',
  '#8b5cf6',
  '#a855f7',
  '#c026d3',
  '#b91c1c',
  '#dc2626',
  '#e11d48',
  '#f43f5e',
  '#c2410c',
  '#ea580c',
  '#b45309',
  '#ca8a04',
  '#065f46',
  '#059669',
  '#10b981',
  '#0d9488',
  '#eef2ff',
  '#dbeafe',
  '#ede9fe',
  '#fce7f3',
  '#fef3c7',
  '#f3f4f6',
  '#f9fafb',
  '#ffffff',
  '#f8fafc',
  '#e2e8f0',
  '#334155',
];

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

export interface Hsv {
  h: number;
  s: number;
  v: number;
}

function clamp(value: number, min = 0, max = 255): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeOpacity(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.round(Math.min(100, Math.max(0, parsed)));
}

export function normalizePx(value: unknown, fallback: number, min = 0, max = 64): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.round(Math.min(max, Math.max(min, parsed)));
}

export function normalizeHex(hex: string, fallback = DEFAULT_THEME_COLORS.sidebarBg): string {
  const raw = hex.replace('#', '').trim();
  if (raw.length === 3) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
  }
  if (raw.length === 6 && /^[0-9a-f]{6}$/i.test(raw)) {
    return `#${raw}`.toLowerCase();
  }
  return fallback;
}

function hexToRgb(hex: string): Rgb {
  const normalized = normalizeHex(hex).slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToHsl(hex: string): Hsl {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6;
        break;
      case gn:
        h = (bn - rn) / delta + 2;
        break;
      default:
        h = (rn - gn) / delta + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (h < 60) {
    rp = c;
    gp = x;
  } else if (h < 120) {
    rp = x;
    gp = c;
  } else if (h < 180) {
    gp = c;
    bp = x;
  } else if (h < 240) {
    gp = x;
    bp = c;
  } else if (h < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }

  return rgbToHex({
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  });
}

export function hexToHsv(hex: string): Hsv {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;

  return {
    h: Math.round(h),
    s: Math.round(s),
    v: Math.round(v),
  };
}

export function hsvToHex(h: number, s: number, v: number): string {
  const sn = clamp(s, 0, 100) / 100;
  const vn = clamp(v, 0, 100) / 100;
  const c = vn * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vn - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (h < 60) {
    rp = c;
    gp = x;
  } else if (h < 120) {
    rp = x;
    gp = c;
  } else if (h < 180) {
    gp = c;
    bp = x;
  } else if (h < 240) {
    gp = x;
    bp = c;
  } else if (h < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }

  return rgbToHex({
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  });
}

export function adjustBrightness(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({
    r: r + amount,
    g: g + amount,
    b: b + amount,
  });
}

export function mixWithWhite(hex: string, ratio: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * ratio);
  return rgbToHex({ r: mix(r), g: mix(g), b: mix(b) });
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function normalizeThemeColors(colors: Partial<ThemeColors>): ThemeColors {
  return {
    sidebarBg: normalizeHex(colors.sidebarBg ?? DEFAULT_THEME_COLORS.sidebarBg, DEFAULT_THEME_COLORS.sidebarBg),
    sidebarActive: normalizeHex(colors.sidebarActive ?? DEFAULT_THEME_COLORS.sidebarActive, DEFAULT_THEME_COLORS.sidebarActive),
    sidebarText: normalizeHex(colors.sidebarText ?? DEFAULT_THEME_COLORS.sidebarText, DEFAULT_THEME_COLORS.sidebarText),
    sidebarBrandOpacity: normalizeOpacity(
      colors.sidebarBrandOpacity,
      DEFAULT_THEME_COLORS.sidebarBrandOpacity
    ),
    sidebarLinkOpacity: normalizeOpacity(colors.sidebarLinkOpacity, DEFAULT_THEME_COLORS.sidebarLinkOpacity),
    sidebarGroupOpacity: normalizeOpacity(colors.sidebarGroupOpacity, DEFAULT_THEME_COLORS.sidebarGroupOpacity),
    button: normalizeHex(colors.button ?? DEFAULT_THEME_COLORS.button, DEFAULT_THEME_COLORS.button),
    tableHeader: normalizeHex(colors.tableHeader ?? DEFAULT_THEME_COLORS.tableHeader, DEFAULT_THEME_COLORS.tableHeader),
    highlightBg: normalizeHex(colors.highlightBg ?? DEFAULT_THEME_COLORS.highlightBg, DEFAULT_THEME_COLORS.highlightBg),
    saveButton: normalizeHex(colors.saveButton ?? DEFAULT_THEME_COLORS.saveButton, DEFAULT_THEME_COLORS.saveButton),
    createProject: normalizeHex(
      colors.createProject ?? DEFAULT_THEME_COLORS.createProject,
      DEFAULT_THEME_COLORS.createProject
    ),
    cornersAccent: normalizeHex(
      colors.cornersAccent ?? (colors as { corners?: string }).corners ?? DEFAULT_THEME_COLORS.cornersAccent,
      DEFAULT_THEME_COLORS.cornersAccent
    ),
    cornersNeutral: normalizeHex(
      colors.cornersNeutral ?? DEFAULT_THEME_COLORS.cornersNeutral,
      DEFAULT_THEME_COLORS.cornersNeutral
    ),
    uiPrimaryText: normalizeHex(
      colors.uiPrimaryText ?? DEFAULT_THEME_COLORS.uiPrimaryText,
      DEFAULT_THEME_COLORS.uiPrimaryText
    ),
    uiSecondaryBg: normalizeHex(
      colors.uiSecondaryBg ?? DEFAULT_THEME_COLORS.uiSecondaryBg,
      DEFAULT_THEME_COLORS.uiSecondaryBg
    ),
    uiSecondaryBorder: normalizeHex(
      colors.uiSecondaryBorder ?? DEFAULT_THEME_COLORS.uiSecondaryBorder,
      DEFAULT_THEME_COLORS.uiSecondaryBorder
    ),
    uiSecondaryText: normalizeHex(
      colors.uiSecondaryText ?? DEFAULT_THEME_COLORS.uiSecondaryText,
      DEFAULT_THEME_COLORS.uiSecondaryText
    ),
    uiDangerBg: normalizeHex(colors.uiDangerBg ?? DEFAULT_THEME_COLORS.uiDangerBg, DEFAULT_THEME_COLORS.uiDangerBg),
    uiDangerText: normalizeHex(
      colors.uiDangerText ?? DEFAULT_THEME_COLORS.uiDangerText,
      DEFAULT_THEME_COLORS.uiDangerText
    ),
    slideEditBg: normalizeHex(colors.slideEditBg ?? colors.button ?? DEFAULT_THEME_COLORS.slideEditBg, DEFAULT_THEME_COLORS.slideEditBg),
    slideViewBg: normalizeHex(
      colors.slideViewBg ?? DEFAULT_THEME_COLORS.slideViewBg,
      DEFAULT_THEME_COLORS.slideViewBg
    ),
    slideViewText: normalizeHex(
      colors.slideViewText ?? DEFAULT_THEME_COLORS.slideViewText,
      DEFAULT_THEME_COLORS.slideViewText
    ),
    slideViewBorder: normalizeHex(
      colors.slideViewBorder ?? DEFAULT_THEME_COLORS.slideViewBorder,
      DEFAULT_THEME_COLORS.slideViewBorder
    ),
    divider: normalizeHex(colors.divider ?? DEFAULT_THEME_COLORS.divider, DEFAULT_THEME_COLORS.divider),
    actionMute: normalizeHex(colors.actionMute ?? DEFAULT_THEME_COLORS.actionMute, DEFAULT_THEME_COLORS.actionMute),
    uiBorderRadius: normalizePx(colors.uiBorderRadius, DEFAULT_THEME_COLORS.uiBorderRadius, 0, 32),
    uiInputHeight: normalizePx(colors.uiInputHeight, DEFAULT_THEME_COLORS.uiInputHeight, 28, 64),
    uiInputFocus: normalizeHex(
      colors.uiInputFocus ?? colors.sidebarBg ?? DEFAULT_THEME_COLORS.uiInputFocus,
      DEFAULT_THEME_COLORS.uiInputFocus
    ),
  };
}

export function normalizeOrgSettings(settings: Partial<OrgSettings>): OrgSettings {
  return {
    inn: typeof settings.inn === 'string' ? settings.inn.trim() : '',
    ogrn: typeof settings.ogrn === 'string' ? settings.ogrn.trim() : '',
    kpp: typeof settings.kpp === 'string' ? settings.kpp.trim() : '',
    fullName: typeof settings.fullName === 'string' ? settings.fullName.trim() : '',
    legalAddress: typeof settings.legalAddress === 'string' ? settings.legalAddress.trim() : '',
    bankAccount: typeof settings.bankAccount === 'string' ? settings.bankAccount.trim() : '',
    bik: typeof settings.bik === 'string' ? settings.bik.trim() : '',
    bankName: typeof settings.bankName === 'string' ? settings.bankName.trim() : '',
    logoDataUrl:
      typeof settings.logoDataUrl === 'string' && settings.logoDataUrl.startsWith('data:')
        ? settings.logoDataUrl
        : null,
  };
}

export function applyThemeColors(colors: ThemeColors): void {
  const theme = normalizeThemeColors(colors);
  const radius = `${theme.uiBorderRadius}px`;
  const inputHeight = `${theme.uiInputHeight}px`;
  const focusRgb = hexToRgb(theme.uiInputFocus);

  document.documentElement.classList.remove('theme-avers', 'theme-emerald', 'theme-gray');
  document.documentElement.classList.add('theme-custom');
  document.documentElement.dataset.theme = 'custom';

  document.documentElement.style.setProperty('--theme-primary', theme.sidebarBg);
  document.documentElement.style.setProperty('--color-navy', theme.sidebarBg);
  document.documentElement.style.setProperty('--color-primary', theme.sidebarBg);
  document.documentElement.style.setProperty('--color-primary-dark', adjustBrightness(theme.sidebarBg, -18));
  document.documentElement.style.setProperty('--color-sidebar-active', theme.sidebarActive);
  document.documentElement.style.setProperty('--color-sidebar-text', theme.sidebarText);
  document.documentElement.style.setProperty(
    '--sidebar-brand-text-opacity',
    `${theme.sidebarBrandOpacity}%`
  );
  document.documentElement.style.setProperty('--sidebar-link-text-opacity', `${theme.sidebarLinkOpacity}%`);
  document.documentElement.style.setProperty(
    '--sidebar-group-label-opacity',
    `${theme.sidebarGroupOpacity}%`
  );
  document.documentElement.style.setProperty('--color-table-header', theme.tableHeader);
  document.documentElement.style.setProperty('--color-accent', theme.button);
  document.documentElement.style.setProperty('--color-accent-hover', adjustBrightness(theme.button, -28));
  document.documentElement.style.setProperty('--color-accent-light', theme.highlightBg);
  document.documentElement.style.setProperty('--shadow-btn', `0 4px 14px ${hexToRgba(theme.saveButton, 0.22)}`);
  document.documentElement.style.setProperty('--color-corner', theme.cornersAccent);
  document.documentElement.style.setProperty('--color-corner-neutral', theme.cornersNeutral);
  document.documentElement.style.setProperty('--color-save-bg', theme.saveButton);
  document.documentElement.style.setProperty('--color-save-bg-hover', adjustBrightness(theme.saveButton, -28));
  document.documentElement.style.setProperty('--color-save-bg-active', adjustBrightness(theme.saveButton, -45));
  document.documentElement.style.setProperty('--color-save-shadow', hexToRgba(theme.saveButton, 0.3));
  document.documentElement.style.setProperty('--color-save-text', theme.uiPrimaryText);
  document.documentElement.style.setProperty(
    '--shadow',
    `0 2px 14px ${hexToRgba(theme.sidebarBg, 0.07)}, 0 1px 4px ${hexToRgba(theme.sidebarBg, 0.04)}`
  );

  /* Create CTAs — project (blue) vs standard/save (green) stay separate */
  document.documentElement.style.setProperty('--ui-create-project-bg', theme.createProject);
  document.documentElement.style.setProperty(
    '--ui-create-project-bg-hover',
    adjustBrightness(theme.createProject, -28)
  );
  document.documentElement.style.setProperty(
    '--ui-create-project-bg-active',
    adjustBrightness(theme.createProject, -45)
  );
  document.documentElement.style.setProperty(
    '--ui-create-project-shadow',
    hexToRgba(theme.createProject, 0.3)
  );
  document.documentElement.style.setProperty('--ui-create-project-text', theme.uiPrimaryText);

  /* Save / standard create (green) */
  document.documentElement.style.setProperty('--ui-primary-bg', theme.saveButton);
  document.documentElement.style.setProperty('--ui-primary-bg-hover', adjustBrightness(theme.saveButton, -28));
  document.documentElement.style.setProperty('--ui-primary-text', theme.uiPrimaryText);
  document.documentElement.style.setProperty('--ui-secondary-bg', theme.uiSecondaryBg);
  document.documentElement.style.setProperty('--ui-secondary-border', theme.uiSecondaryBorder);
  document.documentElement.style.setProperty('--ui-secondary-text', theme.uiSecondaryText);
  document.documentElement.style.setProperty('--ui-danger-bg', theme.uiDangerBg);
  document.documentElement.style.setProperty('--ui-danger-bg-hover', adjustBrightness(theme.uiDangerBg, -20));
  document.documentElement.style.setProperty('--ui-danger-text', theme.uiDangerText);
  document.documentElement.style.setProperty('--ui-border-radius', radius);
  document.documentElement.style.setProperty('--ui-input-height', inputHeight);
  document.documentElement.style.setProperty('--ui-input-focus', theme.uiInputFocus);
  document.documentElement.style.setProperty(
    '--ui-input-focus-ring',
    `rgba(${focusRgb.r}, ${focusRgb.g}, ${focusRgb.b}, 0.12)`
  );

  /* Slide card actions */
  document.documentElement.style.setProperty('--ui-slide-edit-bg', theme.slideEditBg);
  document.documentElement.style.setProperty(
    '--ui-slide-edit-bg-hover',
    adjustBrightness(theme.slideEditBg, -20)
  );
  document.documentElement.style.setProperty('--ui-slide-view-bg', theme.slideViewBg);
  document.documentElement.style.setProperty('--ui-slide-view-text', theme.slideViewText);
  document.documentElement.style.setProperty('--ui-slide-view-border', theme.slideViewBorder);
  document.documentElement.style.setProperty(
    '--ui-slide-view-bg-hover',
    adjustBrightness(theme.slideViewBg, -12)
  );

  /* Badges derived from create colors */
  document.documentElement.style.setProperty('--badge-project-bg', mixWithWhite(theme.createProject, 0.9));
  document.documentElement.style.setProperty(
    '--badge-project-fg',
    adjustBrightness(theme.createProject, -28)
  );
  document.documentElement.style.setProperty('--badge-project-border', mixWithWhite(theme.createProject, 0.7));
  document.documentElement.style.setProperty('--badge-standard-bg', mixWithWhite(theme.saveButton, 0.9));
  document.documentElement.style.setProperty('--badge-standard-fg', adjustBrightness(theme.saveButton, -40));
  document.documentElement.style.setProperty('--badge-standard-border', mixWithWhite(theme.saveButton, 0.7));

  /* Chrome */
  document.documentElement.style.setProperty('--color-divider', theme.divider);
  document.documentElement.style.setProperty('--ui-action-mute', theme.actionMute);
  document.documentElement.style.setProperty('--ui-segment-track-bg', mixWithWhite(theme.divider, 0.35));
  document.documentElement.style.setProperty('--ui-segment-track-border', theme.divider);
  document.documentElement.style.setProperty('--ui-segment-btn-fg', theme.uiSecondaryText);
  document.documentElement.style.setProperty('--ui-segment-btn-active-bg', '#ffffff');
  document.documentElement.style.setProperty('--ui-segment-btn-active-fg', theme.cornersNeutral);

  /* Slide decor aliases */
  document.documentElement.style.setProperty('--slide-accent-corners', theme.cornersAccent);
  document.documentElement.style.setProperty('--slide-main-corners', theme.cornersNeutral);
  document.documentElement.style.setProperty('--slide-table-header-bg', theme.tableHeader);
  document.documentElement.style.setProperty('--slide-highlight-bg', theme.highlightBg);

  /* Danger accent used by destructive UI */
  document.documentElement.style.setProperty('--color-danger', theme.uiDangerBg);
}

function migrateLegacyColors(): ThemeColors | null {
  const primary = localStorage.getItem(COLOR_PRIMARY_KEY);
  const accent = localStorage.getItem(COLOR_ACCENT_KEY);
  if (!primary && !accent) return null;

  return normalizeThemeColors({
    sidebarBg: primary ?? DEFAULT_THEME_COLORS.sidebarBg,
    tableHeader: primary ?? DEFAULT_THEME_COLORS.tableHeader,
    uiInputFocus: primary ?? DEFAULT_THEME_COLORS.uiInputFocus,
    button: accent ?? DEFAULT_THEME_COLORS.button,
    highlightBg: mixWithWhite(accent ?? DEFAULT_THEME_COLORS.button, 0.92),
  });
}

export function loadThemeColors(): ThemeColors {
  const stored = localStorage.getItem(THEME_COLORS_KEY);
  if (stored) {
    try {
      return normalizeThemeColors(JSON.parse(stored) as Partial<ThemeColors>);
    } catch {
      /* fall through */
    }
  }

  const migrated = migrateLegacyColors();
  if (migrated) return migrated;

  return { ...DEFAULT_THEME_COLORS };
}

export function saveThemeColors(colors: ThemeColors): void {
  const theme = normalizeThemeColors(colors);
  localStorage.setItem(THEME_COLORS_KEY, JSON.stringify(theme));
  localStorage.removeItem(COLOR_PRIMARY_KEY);
  localStorage.removeItem(COLOR_ACCENT_KEY);
  applyThemeColors(theme);
}

export function loadOrgSettings(): OrgSettings {
  const stored = localStorage.getItem(ORG_SETTINGS_KEY);
  if (stored) {
    try {
      return normalizeOrgSettings(JSON.parse(stored) as Partial<OrgSettings>);
    } catch {
      /* fall through */
    }
  }
  return { ...DEFAULT_ORG_SETTINGS };
}

export function saveOrgSettings(settings: OrgSettings): void {
  const normalized = normalizeOrgSettings(settings);
  localStorage.setItem(ORG_SETTINGS_KEY, JSON.stringify(normalized));
}

export function initPersonalization(): ThemeColors {
  const colors = loadThemeColors();
  applyThemeColors(colors);
  return colors;
}

export function themeColorsEqual(a: ThemeColors, b: ThemeColors): boolean {
  return (
    a.sidebarBg === b.sidebarBg &&
    a.sidebarActive === b.sidebarActive &&
    a.sidebarText === b.sidebarText &&
    a.sidebarBrandOpacity === b.sidebarBrandOpacity &&
    a.sidebarLinkOpacity === b.sidebarLinkOpacity &&
    a.sidebarGroupOpacity === b.sidebarGroupOpacity &&
    a.button === b.button &&
    a.tableHeader === b.tableHeader &&
    a.highlightBg === b.highlightBg &&
    a.saveButton === b.saveButton &&
    a.createProject === b.createProject &&
    a.cornersAccent === b.cornersAccent &&
    a.cornersNeutral === b.cornersNeutral &&
    a.uiPrimaryText === b.uiPrimaryText &&
    a.uiSecondaryBg === b.uiSecondaryBg &&
    a.uiSecondaryBorder === b.uiSecondaryBorder &&
    a.uiSecondaryText === b.uiSecondaryText &&
    a.uiDangerBg === b.uiDangerBg &&
    a.uiDangerText === b.uiDangerText &&
    a.slideEditBg === b.slideEditBg &&
    a.slideViewBg === b.slideViewBg &&
    a.slideViewText === b.slideViewText &&
    a.slideViewBorder === b.slideViewBorder &&
    a.divider === b.divider &&
    a.actionMute === b.actionMute &&
    a.uiBorderRadius === b.uiBorderRadius &&
    a.uiInputHeight === b.uiInputHeight &&
    a.uiInputFocus === b.uiInputFocus
  );
}

export function orgSettingsEqual(a: OrgSettings, b: OrgSettings): boolean {
  return (
    a.inn === b.inn &&
    a.ogrn === b.ogrn &&
    a.kpp === b.kpp &&
    a.fullName === b.fullName &&
    a.legalAddress === b.legalAddress &&
    a.bankAccount === b.bankAccount &&
    a.bik === b.bik &&
    a.bankName === b.bankName &&
    a.logoDataUrl === b.logoDataUrl
  );
}

function buildThemePreset(
  id: string,
  name: string,
  overrides: Partial<ThemeColors>
): ThemePreset {
  return {
    id,
    name,
    builtin: true,
    colors: normalizeThemeColors({ ...DEFAULT_THEME_COLORS, ...overrides }),
  };
}

/** Встроенные пресеты дизайн-схемы */
export const BUILTIN_THEME_PRESETS: ThemePreset[] = [
  buildThemePreset('avers', 'Аверс', {}),
  buildThemePreset('emerald', 'Изумруд', {
    sidebarBg: '#065f46',
    sidebarActive: '#10b981',
    button: '#059669',
    tableHeader: '#047857',
    highlightBg: '#ecfdf5',
    saveButton: '#10b981',
    createProject: '#2563eb',
    slideEditBg: '#059669',
    cornersAccent: '#10b981',
    cornersNeutral: '#064e3b',
    uiInputFocus: '#059669',
  }),
  buildThemePreset('indigo', 'Индиго', {
    sidebarBg: '#312e81',
    sidebarActive: '#6366f1',
    button: '#4f46e5',
    tableHeader: '#4338ca',
    highlightBg: '#eef2ff',
    saveButton: '#10b981',
    createProject: '#4f46e5',
    slideEditBg: '#6366f1',
    cornersAccent: '#6366f1',
    cornersNeutral: '#1e1b4b',
    uiInputFocus: '#4f46e5',
    uiSecondaryText: '#312e81',
  }),
  buildThemePreset('ocean', 'Океан', {
    sidebarBg: '#0e7490',
    sidebarActive: '#22d3ee',
    button: '#0891b2',
    tableHeader: '#0e7490',
    highlightBg: '#ecfeff',
    saveButton: '#06b6d4',
    createProject: '#2563eb',
    cornersAccent: '#22d3ee',
    cornersNeutral: '#164e63',
    uiInputFocus: '#0891b2',
  }),
  buildThemePreset('graphite', 'Графит', {
    sidebarBg: '#1f2937',
    sidebarActive: '#9ca3af',
    button: '#374151',
    tableHeader: '#374151',
    highlightBg: '#f3f4f6',
    saveButton: '#10b981',
    createProject: '#2563eb',
    cornersAccent: '#6b7280',
    cornersNeutral: '#111827',
    uiInputFocus: '#4b5563',
    uiSecondaryBg: '#f9fafb',
    uiSecondaryBorder: '#d1d5db',
    uiSecondaryText: '#1f2937',
  }),
  buildThemePreset('coral', 'Коралл', {
    sidebarBg: '#9f1239',
    sidebarActive: '#fb7185',
    button: '#e11d48',
    tableHeader: '#be123c',
    highlightBg: '#fff1f2',
    saveButton: '#10b981',
    createProject: '#2563eb',
    slideEditBg: '#f43f5e',
    cornersAccent: '#fb7185',
    cornersNeutral: '#881337',
    uiInputFocus: '#e11d48',
  }),
];

export function createThemePresetId(): string {
  return `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function loadCustomThemePresets(): ThemePreset[] {
  const stored = localStorage.getItem(THEME_PRESETS_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item) => ({
        id: typeof item.id === 'string' ? item.id : createThemePresetId(),
        name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : 'Без названия',
        builtin: false,
        colors: normalizeThemeColors((item.colors as Partial<ThemeColors>) ?? {}),
      }));
  } catch {
    return [];
  }
}

export function saveCustomThemePresets(presets: ThemePreset[]): void {
  const customOnly = presets
    .filter((p) => !p.builtin)
    .map((p) => ({
      id: p.id,
      name: p.name,
      colors: normalizeThemeColors(p.colors),
    }));
  localStorage.setItem(THEME_PRESETS_KEY, JSON.stringify(customOnly));
}

export function getAllThemePresets(custom: ThemePreset[] = loadCustomThemePresets()): ThemePreset[] {
  return [...BUILTIN_THEME_PRESETS, ...custom];
}

export function findMatchingThemePresetId(
  colors: ThemeColors,
  custom: ThemePreset[] = loadCustomThemePresets()
): string | null {
  const match = getAllThemePresets(custom).find((preset) => themeColorsEqual(preset.colors, colors));
  return match?.id ?? null;
}

/** @deprecated use DEFAULT_THEME_COLORS */
export const DEFAULT_COLOR_PRIMARY = DEFAULT_THEME_COLORS.sidebarBg;
/** @deprecated use DEFAULT_THEME_COLORS */
export const DEFAULT_COLOR_ACCENT = DEFAULT_THEME_COLORS.button;

/** @deprecated use saveThemeColors */
export function saveColors(primary: string, accent: string): void {
  saveThemeColors(
    normalizeThemeColors({
      sidebarBg: primary,
      tableHeader: primary,
      uiInputFocus: primary,
      button: accent,
      highlightBg: mixWithWhite(accent, 0.92),
    })
  );
}

/** @deprecated use applyThemeColors */
export function applyCustomColors(primary: string, accent: string): void {
  saveColors(primary, accent);
}

/** @deprecated */
export function suggestAccentFromPrimary(primary: string): string {
  return mixWithWhite(adjustBrightness(primary, 80), 0.3);
}
