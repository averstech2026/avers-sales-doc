export type AppRole = 'superadmin' | 'user';

export const DEFAULT_USER_ROLE: AppRole = 'user';

/**
 * Email-адреса суперадминов в коде (всегда получают роль superadmin при входе).
 * Добавьте сюда свой корпоративный email, если не используете VITE_SUPERADMIN_EMAILS.
 */
export const SUPERADMIN_EMAILS_IN_CODE: readonly string[] = [
  'inert@mail.ru',
];

function collectSuperadminEmails(): string[] {
  const fromEnv = (import.meta.env.VITE_SUPERADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const fromCode = SUPERADMIN_EMAILS_IN_CODE.map((email) => email.trim().toLowerCase()).filter(Boolean);

  return [...new Set([...fromCode, ...fromEnv])];
}

export function isSuperadminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return collectSuperadminEmails().includes(normalized);
}

export function resolveUserRole(email: string, storedRole?: string | null): AppRole {
  if (isSuperadminEmail(email)) return 'superadmin';
  if (storedRole === 'superadmin') return 'superadmin';
  return DEFAULT_USER_ROLE;
}

export function isSuperadminRole(role: AppRole): boolean {
  return role === 'superadmin';
}

export function getRoleLabel(role: AppRole): string {
  return role === 'superadmin' ? 'Суперадмин' : 'Пользователь';
}
