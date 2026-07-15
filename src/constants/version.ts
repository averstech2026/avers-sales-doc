import {
  APP_RELEASE_DATE,
  APP_VERSION,
  VERSION_HISTORY as VERSION_HISTORY_DATA,
} from './version.data';

export interface VersionEntry {
  version: string;
  date: string;
  notes?: string;
}

export const VERSION_HISTORY: VersionEntry[] = VERSION_HISTORY_DATA.map((entry) => ({
  version: entry.version,
  date: entry.date,
  notes: 'notes' in entry ? entry.notes : undefined,
}));

export { APP_VERSION, APP_RELEASE_DATE };

export function formatVersionDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

export function getVersionLabel(): string {
  return `v${APP_VERSION} от ${formatVersionDate(APP_RELEASE_DATE)}`;
}

export function getCopyrightYear(): number {
  return new Date().getFullYear();
}
