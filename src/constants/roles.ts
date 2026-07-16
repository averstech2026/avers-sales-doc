import type { Role, RoleHours, Rates } from '../types';

export const ROLES: Role[] = [
  { id: 'consultant', name: 'Консультант-аналитик', shortName: 'Консультант', defaultRate: 3840 },
  { id: 'architect', name: 'Системный архитектор', shortName: 'Архитектор', defaultRate: 4680 },
  { id: 'backend', name: 'Программист бэк-енд', shortName: 'Бэк-енд', defaultRate: 4680 },
  { id: 'frontend', name: 'Программист фронт-енд', shortName: 'Фронт-енд', defaultRate: 4200 },
  { id: 'engineer', name: 'Системный инженер', shortName: 'Инженер', defaultRate: 4200 },
  { id: 'designer', name: 'Дизайнер', shortName: 'Дизайнер', defaultRate: 3840 },
];

export const VAT_RATE = 0.05;

export const EMPTY_HOURS = (): RoleHours => ({
  consultant: 0,
  architect: 0,
  backend: 0,
  frontend: 0,
  engineer: 0,
  designer: 0,
});

export const DEFAULT_RATES = (): Rates => ({
  consultant: 3840,
  architect: 4680,
  backend: 4680,
  frontend: 4200,
  engineer: 4200,
  designer: 3840,
});

export const ROLE_IDS = ROLES.map((r) => r.id);

export const COLLECTIONS = {
  estimates: 'estimates',
  users: 'users',
  companies: 'companies',
  productsDirectory: 'products_directory',
  contractTemplates: 'contract_templates',
  settings: 'settings',
} as const;

/** Fixed width for role hour columns — must match CSS `--estimate-role-col-width`. */
export const ROLE_COL_WIDTH_PX = 88;
