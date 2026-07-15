export interface ThemeColors {
  sidebarBg: string;
  sidebarActive: string;
  button: string;
  tableHeader: string;
  highlightBg: string;
  saveButton: string;
  cornersAccent: string;
  cornersNeutral: string;
}

export const THEME_COLORS_KEY = 'avers-theme-colors';

/** @deprecated migrated to THEME_COLORS_KEY */
export const COLOR_PRIMARY_KEY = 'avers-color-primary';
/** @deprecated migrated to THEME_COLORS_KEY */
export const COLOR_ACCENT_KEY = 'avers-color-accent';

export const DEFAULT_THEME_COLORS: ThemeColors = {
  sidebarBg: '#7c818a',
  sidebarActive: '#db4040',
  button: '#d81818',
  tableHeader: '#7c818a',
  highlightBg: '#fceded',
  saveButton: '#10b981',
  cornersAccent: '#d81818',
  cornersNeutral: '#1f2937',
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
    button: normalizeHex(colors.button ?? DEFAULT_THEME_COLORS.button, DEFAULT_THEME_COLORS.button),
    tableHeader: normalizeHex(colors.tableHeader ?? DEFAULT_THEME_COLORS.tableHeader, DEFAULT_THEME_COLORS.tableHeader),
    highlightBg: normalizeHex(colors.highlightBg ?? DEFAULT_THEME_COLORS.highlightBg, DEFAULT_THEME_COLORS.highlightBg),
    saveButton: normalizeHex(colors.saveButton ?? DEFAULT_THEME_COLORS.saveButton, DEFAULT_THEME_COLORS.saveButton),
    cornersAccent: normalizeHex(
      colors.cornersAccent ?? (colors as { corners?: string }).corners ?? DEFAULT_THEME_COLORS.cornersAccent,
      DEFAULT_THEME_COLORS.cornersAccent
    ),
    cornersNeutral: normalizeHex(
      colors.cornersNeutral ?? DEFAULT_THEME_COLORS.cornersNeutral,
      DEFAULT_THEME_COLORS.cornersNeutral
    ),
  };
}

export function applyThemeColors(colors: ThemeColors): void {
  const theme = normalizeThemeColors(colors);

  document.documentElement.classList.remove('theme-avers', 'theme-emerald', 'theme-gray');
  document.documentElement.classList.add('theme-custom');
  document.documentElement.dataset.theme = 'custom';

  document.documentElement.style.setProperty('--theme-primary', theme.sidebarBg);
  document.documentElement.style.setProperty('--color-navy', theme.sidebarBg);
  document.documentElement.style.setProperty('--color-primary', theme.sidebarBg);
  document.documentElement.style.setProperty('--color-primary-dark', adjustBrightness(theme.sidebarBg, -18));
  document.documentElement.style.setProperty('--color-sidebar-active', theme.sidebarActive);
  document.documentElement.style.setProperty('--color-table-header', theme.tableHeader);
  document.documentElement.style.setProperty('--color-accent', theme.button);
  document.documentElement.style.setProperty('--color-accent-hover', adjustBrightness(theme.button, -28));
  document.documentElement.style.setProperty('--color-accent-light', theme.highlightBg);
  document.documentElement.style.setProperty('--color-corner', theme.cornersAccent);
  document.documentElement.style.setProperty('--color-corner-neutral', theme.cornersNeutral);
  document.documentElement.style.setProperty('--color-save-bg', theme.saveButton);
  document.documentElement.style.setProperty('--color-save-bg-hover', adjustBrightness(theme.saveButton, -28));
  document.documentElement.style.setProperty('--color-save-bg-active', adjustBrightness(theme.saveButton, -45));
  document.documentElement.style.setProperty('--color-save-shadow', hexToRgba(theme.saveButton, 0.3));
  document.documentElement.style.setProperty(
    '--shadow',
    `0 2px 14px ${hexToRgba(theme.sidebarBg, 0.07)}, 0 1px 4px ${hexToRgba(theme.sidebarBg, 0.04)}`
  );
}

function migrateLegacyColors(): ThemeColors | null {
  const primary = localStorage.getItem(COLOR_PRIMARY_KEY);
  const accent = localStorage.getItem(COLOR_ACCENT_KEY);
  if (!primary && !accent) return null;

  return normalizeThemeColors({
    sidebarBg: primary ?? DEFAULT_THEME_COLORS.sidebarBg,
    tableHeader: primary ?? DEFAULT_THEME_COLORS.tableHeader,
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

export function initPersonalization(): ThemeColors {
  const colors = loadThemeColors();
  applyThemeColors(colors);
  return colors;
}

export function themeColorsEqual(a: ThemeColors, b: ThemeColors): boolean {
  return (
    a.sidebarBg === b.sidebarBg &&
    a.sidebarActive === b.sidebarActive &&
    a.button === b.button &&
    a.tableHeader === b.tableHeader &&
    a.highlightBg === b.highlightBg &&
    a.saveButton === b.saveButton &&
    a.cornersAccent === b.cornersAccent &&
    a.cornersNeutral === b.cornersNeutral
  );
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
