/** Автоматически генерируется scripts/bump-version.mjs — не редактировать вручную. */

export const VERSION_HISTORY = [
  { version: '1.0.0', date: '2026-07-15', notes: 'Первый релиз' },
  { version: '1.0.1', date: '2026-07-16', notes: 'Add task editing functionality to estimate editor with improved UI for task creation and management. Introduced a new task input interface with save and cancel options, and updated presentation slide ' },
] as const;

const current = VERSION_HISTORY[VERSION_HISTORY.length - 1];

export const APP_VERSION = current.version;
export const APP_RELEASE_DATE = current.date;
