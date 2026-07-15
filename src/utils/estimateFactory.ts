import { v4 as uuidv4 } from 'uuid';
import type { Estimate, Section, Task, Rates, RoleHours } from '../types';
import { DEFAULT_RATES, EMPTY_HOURS } from '../constants/roles';

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
    projectName: 'Новый проект',
    clientName: '',
    description: '',
    sections: createDefaultSections(),
    rates: DEFAULT_RATES(),
    clientLogoId: 'none',
    presentationSlides: { about: false, recognition: false, kiosk: false },
    isDraft: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Копия сметы с новыми id разделов/задач и пометкой «(Копия)» в названии. */
export function buildDuplicateEstimate(source: Estimate): Estimate {
  const now = new Date().toISOString();
  const baseName = source.projectName.trim() || 'Новый проект';

  return {
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
    clientLogoId: source.clientLogoId === 'custom' ? 'custom' : 'none',
    ...(source.clientLogoCustom !== undefined
      ? { clientLogoCustom: source.clientLogoCustom }
      : {}),
    ...(source.clientId !== undefined ? { clientId: source.clientId } : {}),
    ...(source.contractTemplateId !== undefined
      ? { contractTemplateId: source.contractTemplateId }
      : {}),
    presentationSlides: {
      about: source.presentationSlides?.about === true,
      recognition: source.presentationSlides?.recognition === true,
      kiosk: source.presentationSlides?.kiosk === true,
    },
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
