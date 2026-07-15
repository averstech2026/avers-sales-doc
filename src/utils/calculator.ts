import type { Estimate, Section, Rates, RoleHours, SectionTotals, EstimateTotals } from '../types';
import { ROLE_IDS, VAT_RATE } from '../constants/roles';

export function sumHours(a: RoleHours, b: RoleHours): RoleHours {
  const result = {} as RoleHours;
  for (const role of ROLE_IDS) {
    result[role] = (a[role] || 0) + (b[role] || 0);
  }
  return result;
}

export function totalHours(hours: RoleHours): number {
  return ROLE_IDS.reduce((sum, role) => sum + (hours[role] || 0), 0);
}

export function calculateTaskCost(hours: RoleHours, rates: Rates): number {
  return ROLE_IDS.reduce((sum, role) => sum + (hours[role] || 0) * rates[role], 0);
}

export function calculateSectionTotals(section: Section, rates: Rates): SectionTotals {
  const hours = section.tasks.reduce(
    (acc, task) => sumHours(acc, task.hours),
    {
      consultant: 0,
      architect: 0,
      backend: 0,
      frontend: 0,
      engineer: 0,
      designer: 0,
    } as RoleHours
  );
  const cost = calculateTaskCost(hours, rates);
  return { hours, cost };
}

export function calculateEstimateTotals(estimate: Estimate): EstimateTotals {
  const hours = estimate.sections.reduce(
    (acc, section) => {
      const sectionTotals = calculateSectionTotals(section, estimate.rates);
      return sumHours(acc, sectionTotals.hours);
    },
    {
      consultant: 0,
      architect: 0,
      backend: 0,
      frontend: 0,
      engineer: 0,
      designer: 0,
    } as RoleHours
  );

  const subtotal = estimate.sections.reduce(
    (sum, section) => sum + calculateSectionTotals(section, estimate.rates).cost,
    0
  );

  const vat = Math.round(subtotal * VAT_RATE);
  const totalWithVat = subtotal + vat;

  return {
    hours,
    totalHours: totalHours(hours),
    subtotal,
    vat,
    totalWithVat,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

export function formatDate(date?: string): string {
  if (!date) return new Date().toLocaleDateString('ru-RU');
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
