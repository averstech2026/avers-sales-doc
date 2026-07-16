/**
 * Контроллер расчётов для типового внедрения (ПО, оборудование и услуги).
 */

import { v4 as uuidv4 } from 'uuid';
import {
  findHardwareProduct,
  findServiceProduct,
  findSoftwareProduct,
  type CatalogItemProduct,
  type HardwareProduct,
  type ServiceProduct,
  type SoftwareProduct,
} from '../data/products-directory';
import type {
  StandardEstimateTotals,
  StandardItemKind,
  StandardLineItem,
  StandardPaymentScheme,
} from '../types';

export const STANDARD_VAT_OPTIONS = [{ value: 0.05, label: '5%' }] as const;

export const DEFAULT_STANDARD_VAT_RATE = 0.05;

/** Стоимость одной строки спецификации */
export function calculateLineTotal(item: StandardLineItem): number {
  return Math.max(0, item.unitPrice) * Math.max(0, item.quantity);
}

/** Цена из справочника для выбранной схемы оплаты */
export function getCatalogUnitPrice(
  catalogId: string,
  kind: StandardItemKind,
  scheme: StandardPaymentScheme
): number {
  if (kind === 'service') {
    return findServiceProduct(catalogId)?.price ?? 0;
  }
  if (kind === 'hardware') {
    return findHardwareProduct(catalogId)?.price ?? 0;
  }

  const software = findSoftwareProduct(catalogId);
  if (!software) return 0;
  return scheme === 'rent' ? software.subscriptionPrice : software.oneTimePrice;
}

/** Подставить цену при смене схемы оплаты ПО */
export function resolvePriceOnSchemeChange(
  item: StandardLineItem,
  newScheme: StandardPaymentScheme
): number {
  if (item.kind !== 'software') return item.unitPrice;
  return getCatalogUnitPrice(item.catalogId, item.kind, newScheme);
}

/** Создать строку спецификации из позиции справочника */
export function createLineItemFromCatalog(
  product: CatalogItemProduct,
  kind: StandardItemKind
): StandardLineItem {
  if (kind === 'software') {
    const sw = product as SoftwareProduct;
    return {
      id: uuidv4(),
      catalogId: sw.id,
      kind: 'software',
      name: sw.name,
      description: sw.description,
      paymentScheme: 'buyout',
      unitPrice: sw.oneTimePrice,
      quantity: 1,
      unit: sw.unit,
    };
  }

  if (kind === 'hardware') {
    const hw = product as HardwareProduct;
    return {
      id: uuidv4(),
      catalogId: hw.id,
      kind: 'hardware',
      name: hw.name,
      description: hw.description,
      paymentScheme: 'fixed',
      unitPrice: hw.price,
      quantity: 1,
      unit: hw.unit,
    };
  }

  const svc = product as ServiceProduct;
  return {
    id: uuidv4(),
    catalogId: svc.id,
    kind: 'service',
    name: svc.name,
    description: svc.description,
    paymentScheme: 'fixed',
    unitPrice: svc.price,
    quantity: 1,
    unit: svc.unit,
  };
}

/**
 * Добавить позицию из справочника.
 * Дубликаты по catalogId: увеличивает quantity на 1 вместо новой строки.
 */
export function addCatalogItem(
  items: StandardLineItem[],
  product: CatalogItemProduct,
  kind: StandardItemKind
): StandardLineItem[] {
  const existing = items.find((item) => item.catalogId === product.id);
  if (existing) {
    return items.map((item) =>
      item.catalogId === product.id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  }
  return [...items, createLineItemFromCatalog(product, kind)];
}

/** Глобальный пересчёт итогов типового внедрения (НДС фиксированно 5%) */
export function calculateStandardTotals(
  items: StandardLineItem[],
  _vatRate: number = DEFAULT_STANDARD_VAT_RATE
): StandardEstimateTotals {
  let oneTimeSubtotal = 0;
  let recurringMonthly = 0;

  for (const item of items) {
    const lineTotal = calculateLineTotal(item);
    if (item.paymentScheme === 'rent') {
      recurringMonthly += lineTotal;
    } else {
      // Выкуп ПО, услуги и оборудование — единоразово
      oneTimeSubtotal += lineTotal;
    }
  }

  const vatRate = DEFAULT_STANDARD_VAT_RATE;
  const vat = Math.round(oneTimeSubtotal * vatRate);
  const oneTimeWithVat = oneTimeSubtotal + vat;

  return {
    oneTimeSubtotal,
    oneTimeWithVat,
    recurringMonthly,
    vat,
    itemCount: items.length,
    vatRate,
  };
}

export function isStandardEstimateType(type?: string): boolean {
  return type === 'standard';
}

export function formatStandardLineCost(item: StandardLineItem): string {
  const total = calculateLineTotal(item);
  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(total);

  if (item.paymentScheme === 'rent') {
    return `${formatted} / мес.`;
  }
  return formatted;
}
