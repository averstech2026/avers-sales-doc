import { v4 as uuidv4 } from 'uuid';
import type { Estimate, Rates, RoleHours, Section, Task } from '../types';
import { DEFAULT_RATES, EMPTY_HOURS } from '../constants/roles';
import {
  createDefaultPresentationSlidesSelection,
  normalizePresentationSlidesSelection,
} from './presentationSlides';
import { DEFAULT_STANDARD_VAT_RATE } from './standardCalculator';

export function createTask(
  name: string,
  description = '',
  hours: Partial<RoleHours> = {}
): Task {
  return {
    id: uuidv4(),
    name,
    description,
    hours: { ...EMPTY_HOURS(), ...hours },
  };
}

export function createSection(name: string, tasks: Task[] = []): Section {
  return { id: uuidv4(), name, tasks };
}

/** Avoid «1. 1. …» when section.name already includes a leading index. */
export function formatNumberedSectionTitle(name: string, index: number): string {
  const trimmed = name.trim();
  if (/^\d+\.\s*/.test(trimmed)) return trimmed;
  return `${index + 1}. ${trimmed}`;
}

export function createDefaultSections(): Section[] {
  return [
    createSection('1. Обсуждение с заказчиком ФТ (функциональных требований)', [
      createTask('Обсуждение требований', '', { consultant: 18 }),
    ]),
    createSection('2. Анализ технической реализации ФТ', [
      createTask(
        'Анализ технологической осуществимости, исследование архитектурных решений, проверка гипотез',
        '',
        { architect: 24 }
      ),
    ]),
  ];
}

export function createNewEstimate(
  overrides: Partial<Estimate> = {}
): Estimate {
  const now = new Date().toISOString();
  return {
    type: 'project',
    projectName: 'Новый проект',
    clientName: '',
    description: '',
    sections: createDefaultSections(),
    rates: DEFAULT_RATES(),
    clientLogoId: 'none',
    presentationSlides: createDefaultPresentationSlidesSelection(),
    includeLegalRequisites: true,
    isDraft: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Новая смета «Типовое внедрение (ПО и Услуги)» */
export function createNewStandardEstimate(
  overrides: Partial<Estimate> = {}
): Estimate {
  const now = new Date().toISOString();
  return {
    type: 'standard',
    projectName: 'Типовое внедрение',
    clientName: '',
    description: '',
    sections: [],
    rates: DEFAULT_RATES(),
    standardItems: [],
    vatRate: DEFAULT_STANDARD_VAT_RATE,
    clientLogoId: 'none',
    presentationSlides: createDefaultPresentationSlidesSelection(),
    includeLegalRequisites: true,
    isDraft: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function isStandardEstimate(estimate: Estimate): boolean {
  return estimate.type === 'standard';
}

/** Копия сметы с новыми id разделов/задач и пометкой «(Копия)» в названии. */
export function buildDuplicateEstimate(source: Estimate): Estimate {
  const now = new Date().toISOString();
  const baseName = source.projectName.trim() || 'Новый проект';

  return {
    type: source.type ?? 'project',
    projectName: `${baseName} (Копия)`,
    clientName: source.clientName ?? '',
    description: source.description ?? '',
    sections: source.sections.map((section) => ({
      id: uuidv4(),
      name: section.name,
      tasks: section.tasks.map((task) => ({
        id: uuidv4(),
        name: task.name,
        description: task.description ?? '',
        hours: { ...task.hours },
      })),
    })),
    rates: { ...source.rates },
    ...(source.standardItems
      ? {
          standardItems: source.standardItems.map((item) => ({
            ...item,
            id: uuidv4(),
          })),
        }
      : {}),
    ...(source.vatRate !== undefined ? { vatRate: source.vatRate } : {}),
    clientLogoId: source.clientLogoId === 'custom' ? 'custom' : 'none',
    ...(source.clientLogoCustom !== undefined
      ? { clientLogoCustom: source.clientLogoCustom }
      : {}),
    ...(source.clientId !== undefined ? { clientId: source.clientId } : {}),
    ...(source.contractTemplateId !== undefined
      ? { contractTemplateId: source.contractTemplateId }
      : {}),
    presentationSlides: normalizePresentationSlidesSelection(source.presentationSlides),
    includeLegalRequisites: source.includeLegalRequisites !== false,
    isDraft: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function cloneEstimate(estimate: Estimate): Estimate {
  return JSON.parse(JSON.stringify(estimate));
}

export function mergeRates(base: Rates, incoming?: Partial<Rates>): Rates {
  return { ...base, ...incoming };
}

/** Черновик: новая смета, копия или явный флаг isDraft. */
export function isDraftEstimate(estimate: Estimate): boolean {
  if (estimate.isDraft === true) return true;
  if (!estimate.id) return true;
  return /\(Копия\)/i.test(estimate.projectName);
}

/** Удалять из Firestore при отмене (уже сохранённый черновик). */
export function shouldDeleteOnCancel(estimate: Estimate): boolean {
  if (!estimate.id) return false;
  return estimate.isDraft === true || /\(Копия\)/i.test(estimate.projectName);
}

export function getCancelConfirmMessage(estimate: Estimate, isDirty: boolean): string {
  if (shouldDeleteOnCancel(estimate)) {
    return 'Удалить этот черновик сметы? Все внесённые изменения будут потеряны безвозвратно.';
  }
  if (isDirty) {
    return 'Выйти без сохранения? Несохранённые изменения будут потеряны.';
  }
  return 'Выйти из редактора сметы?';
}

export function serializeEstimateForCompare(estimate: Estimate): string {
  return JSON.stringify(estimate);
}
