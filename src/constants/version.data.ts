/** Автоматически генерируется scripts/bump-version.mjs — не редактировать вручную. */

export const VERSION_HISTORY = [
  { version: '1.0.0', date: '2026-07-15', notes: 'Первый релиз' },
] as const;

const current = VERSION_HISTORY[VERSION_HISTORY.length - 1];

export const APP_VERSION = current.version;
export const APP_RELEASE_DATE = current.date;
