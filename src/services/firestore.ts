/**
 * Firestore — сметы и справочники.
 * Рекомендуемые правила безопасности см. в src/services/auth.ts (блок комментария в начале файла).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { getDb, isFirebaseConfigured } from '../firebase';
import { COLLECTIONS } from '../constants/roles';
import type {
  Estimate,
  EstimateListItem,
  Company,
  CompanyInput,
  CatalogProduct,
  CatalogProductInput,
  CatalogProductType,
  ContractTemplate,
  EstimateAuthorMeta,
} from '../types';
import { calculateEstimateTotals } from '../utils/calculator';
import { calculateStandardTotals } from '../utils/standardCalculator';
import { isStandardEstimate } from '../utils/estimateFactory';
import { buildDuplicateEstimate } from '../utils/estimateFactory';
import { normalizePresentationSlidesSelection } from '../utils/presentationSlides';
import { COMPANY_DEFAULTS } from '../models/firestore';
import {
  catalogProductsToDirectory,
  DEFAULT_PRODUCTS_DIRECTORY,
  setProductsCatalogCache,
  type ProductsDirectory,
} from '../data/products-directory';

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

export async function saveEstimate(
  estimate: Estimate,
  author: EstimateAuthorMeta
): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase не настроен');
  }

  const db = getDb();
  const id = estimate.id || uuidv4();
  const now = new Date().toISOString();
  const isNew = !estimate.id || !estimate.createdByUid;

  const data: Record<string, unknown> = {
    id,
    type: estimate.type ?? 'project',
    projectName: estimate.projectName,
    clientName: estimate.clientName ?? '',
    description: estimate.description ?? '',
    sections: estimate.sections,
    rates: estimate.rates,
    createdByUid: isNew ? author.createdByUid : estimate.createdByUid,
    createdByName: isNew
      ? author.createdByName.trim() || 'Не указан'
      : (estimate.createdByName ?? (author.createdByName.trim() || 'Не указан')),
    createdAt: estimate.createdAt || now,
    updatedAt: now,
    savedAt: serverTimestamp(),
  };

  if (estimate.clientLogoId !== undefined) {
    data.clientLogoId = estimate.clientLogoId;
  }
  if (estimate.clientLogoCustom !== undefined) {
    data.clientLogoCustom = estimate.clientLogoCustom;
  }
  data.clientId = estimate.clientId || null;
  if (estimate.contractTemplateId !== undefined) {
    data.contractTemplateId = estimate.contractTemplateId;
  }
  if (estimate.presentationSlides !== undefined) {
    data.presentationSlides = normalizePresentationSlidesSelection(
      estimate.presentationSlides
    );
  }
  if (estimate.includeLegalRequisites !== undefined) {
    data.includeLegalRequisites = estimate.includeLegalRequisites;
  }
  if (estimate.isDraft !== undefined) {
    data.isDraft = estimate.isDraft;
  }
  if (estimate.isArchived === true) {
    data.isArchived = true;
  }
  if (estimate.standardItems !== undefined) {
    data.standardItems = estimate.standardItems;
  }
  if (estimate.vatRate !== undefined) {
    data.vatRate = estimate.vatRate;
  }
  if (estimate.oneTimeTotal !== undefined) {
    data.oneTimeTotal = estimate.oneTimeTotal;
  }
  if (estimate.recurringTotal !== undefined) {
    data.recurringTotal = estimate.recurringTotal;
  }

  await setDoc(doc(db, COLLECTIONS.estimates, id), data);
  return id;
}

export async function deleteEstimate(id: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase не настроен');
  }
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.estimates, id));
}

export async function loadEstimate(id: string): Promise<Estimate | null> {
  if (!isFirebaseConfigured()) return null;

  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTIONS.estimates, id));
  if (!snap.exists()) return null;

  const data = snap.data() as Estimate;
  return {
    ...data,
    id: snap.id,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    ...(data.presentationSlides !== undefined
      ? {
          presentationSlides: normalizePresentationSlidesSelection(
            data.presentationSlides
          ),
        }
      : {}),
  };
}

/** Общая база организации — все сметы для авторизованных пользователей. */
async function loadUsersFullNameMap(): Promise<Map<string, string>> {
  const db = getDb();
  const snap = await getDocs(collection(db, COLLECTIONS.users));
  const map = new Map<string, string>();
  snap.docs.forEach((userDoc) => {
    const fullName = (userDoc.data().fullName as string | undefined)?.trim();
    if (fullName) {
      map.set(userDoc.id, fullName);
    }
  });
  return map;
}

function resolveListAuthorName(
  estimate: Estimate,
  nameByUid: Map<string, string>
): string | undefined {
  if (estimate.createdByUid) {
    const fromProfile = nameByUid.get(estimate.createdByUid);
    if (fromProfile) return fromProfile;
  }
  const stored = estimate.createdByName?.trim();
  if (stored && !stored.includes('@')) return stored;
  return undefined;
}

export async function listEstimates(max = 100): Promise<EstimateListItem[]> {
  if (!isFirebaseConfigured()) return [];

  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.estimates),
    orderBy('updatedAt', 'desc'),
    limit(max)
  );

  const [snap, nameByUid] = await Promise.all([getDocs(q), loadUsersFullNameMap()]);

  return snap.docs.map((d) => {
    const data = d.data() as Estimate;
    const totalWithVat = isStandardEstimate(data)
      ? calculateStandardTotals(data.standardItems ?? [], data.vatRate ?? 0.05).oneTimeWithVat
      : calculateEstimateTotals(data).totalWithVat;
    return {
      id: d.id,
      projectName: data.projectName || 'Без названия',
      clientName: data.clientName || '—',
      totalWithVat,
      updatedAt: toIso(data.updatedAt),
      createdByName: resolveListAuthorName(data, nameByUid),
      isArchived: data.isArchived === true,
      type: data.type === 'standard' ? 'standard' : 'project',
    };
  });
}

export async function toggleArchiveEstimate(
  estimateId: string,
  archived: boolean,
  author: EstimateAuthorMeta
): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase не настроен');
  }

  const estimate = await loadEstimate(estimateId);
  if (!estimate) {
    throw new Error('Смета не найдена');
  }

  const db = getDb();
  const now = new Date().toISOString();

  const data: Record<string, unknown> = {
    id: estimateId,
    type: estimate.type ?? 'project',
    projectName: estimate.projectName || 'Без названия',
    clientName: estimate.clientName ?? '',
    description: estimate.description ?? '',
    sections: estimate.sections,
    rates: estimate.rates,
    createdByUid: estimate.createdByUid ?? author.createdByUid,
    createdByName:
      estimate.createdByName?.trim() || author.createdByName.trim() || 'Не указан',
    createdAt: estimate.createdAt || now,
    updatedAt: now,
    isArchived: archived,
  };

  if (estimate.clientLogoId !== undefined) {
    data.clientLogoId = estimate.clientLogoId;
  }
  if (estimate.clientLogoCustom !== undefined) {
    data.clientLogoCustom = estimate.clientLogoCustom;
  }
  if (estimate.clientId !== undefined) {
    data.clientId = estimate.clientId;
  }
  if (estimate.contractTemplateId !== undefined) {
    data.contractTemplateId = estimate.contractTemplateId;
  }
  if (estimate.presentationSlides !== undefined) {
    data.presentationSlides = normalizePresentationSlidesSelection(
      estimate.presentationSlides
    );
  }
  if (estimate.includeLegalRequisites !== undefined) {
    data.includeLegalRequisites = estimate.includeLegalRequisites;
  }
  if (estimate.isDraft !== undefined) {
    data.isDraft = estimate.isDraft;
  }
  if (estimate.standardItems !== undefined) {
    data.standardItems = estimate.standardItems;
  }
  if (estimate.vatRate !== undefined) {
    data.vatRate = estimate.vatRate;
  }

  await setDoc(doc(db, COLLECTIONS.estimates, estimateId), data, { merge: true });
}

export async function duplicateEstimate(
  estimateId: string,
  author: EstimateAuthorMeta
): Promise<string> {
  const source = await loadEstimate(estimateId);
  if (!source) {
    throw new Error('Смета не найдена');
  }
  const copy = buildDuplicateEstimate(source);
  return saveEstimate(copy, author);
}

function mapCompanyDoc(id: string, raw: Record<string, unknown>): Company {
  return {
    id,
    name: String(raw.name ?? ''),
    inn: String(raw.inn ?? ''),
    kpp: String(raw.kpp ?? ''),
    ogrn: String(raw.ogrn ?? ''),
    legalAddress: String(raw.legalAddress ?? ''),
    bankAccount: String(raw.bankAccount ?? ''),
    bik: String(raw.bik ?? ''),
    bankName: String(raw.bankName ?? ''),
    director: String(raw.director ?? ''),
    directorBasis: String(raw.directorBasis ?? COMPANY_DEFAULTS.directorBasis),
    logoDataUrl: (raw.logoDataUrl as string | null | undefined) ?? null,
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

export async function listCompanies(): Promise<Company[]> {
  if (!isFirebaseConfigured()) return [];
  const db = getDb();
  try {
    const q = query(collection(db, COLLECTIONS.companies), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapCompanyDoc(d.id, d.data() as Record<string, unknown>));
  } catch {
    const snap = await getDocs(collection(db, COLLECTIONS.companies));
    return snap.docs
      .map((d) => mapCompanyDoc(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }
}

export async function loadCompany(id: string): Promise<Company | null> {
  if (!isFirebaseConfigured()) return null;
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTIONS.companies, id));
  if (!snap.exists()) return null;
  return mapCompanyDoc(snap.id, snap.data() as Record<string, unknown>);
}

export async function saveCompany(company: CompanyInput): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase не настроен');
  }

  const db = getDb();
  const id = company.id || uuidv4();
  const now = new Date().toISOString();
  const name = company.name.trim();
  if (!name) {
    throw new Error('Укажите название компании');
  }

  const data: Record<string, unknown> = {
    id,
    name,
    inn: (company.inn ?? '').trim(),
    kpp: (company.kpp ?? '').trim(),
    ogrn: (company.ogrn ?? '').trim(),
    legalAddress: (company.legalAddress ?? '').trim(),
    bankAccount: (company.bankAccount ?? '').trim(),
    bik: (company.bik ?? '').trim(),
    bankName: (company.bankName ?? '').trim(),
    director: (company.director ?? '').trim(),
    directorBasis: (company.directorBasis ?? COMPANY_DEFAULTS.directorBasis).trim() || COMPANY_DEFAULTS.directorBasis,
    logoDataUrl: company.logoDataUrl ?? null,
    createdAt: company.createdAt || now,
    updatedAt: now,
  };

  await setDoc(doc(db, COLLECTIONS.companies, id), data);
  return id;
}

export async function deleteCompany(id: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase не настроен');
  }
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.companies, id));
}

function mapCatalogProductDoc(id: string, raw: Record<string, unknown>): CatalogProduct {
  const rawType = String(raw.type ?? 'software');
  const type: CatalogProductType =
    rawType === 'service' ? 'service' : rawType === 'hardware' ? 'hardware' : 'software';
  const defaultUnit = type === 'service' ? 'услуга' : type === 'hardware' ? 'шт.' : 'лиц.';
  const base: CatalogProduct = {
    id,
    type,
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    unit: String(raw.unit ?? defaultUnit),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };

  if (type === 'software') {
    return {
      ...base,
      oneTimePrice: Number(raw.oneTimePrice) || 0,
      subscriptionPrice: Number(raw.subscriptionPrice) || 0,
    };
  }

  return {
    ...base,
    price: Number(raw.price) || 0,
  };
}

export async function listCatalogProducts(): Promise<CatalogProduct[]> {
  if (!isFirebaseConfigured()) return [];
  const db = getDb();
  try {
    const q = query(collection(db, COLLECTIONS.productsDirectory), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapCatalogProductDoc(d.id, d.data() as Record<string, unknown>));
  } catch {
    const snap = await getDocs(collection(db, COLLECTIONS.productsDirectory));
    return snap.docs
      .map((d) => mapCatalogProductDoc(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }
}

export async function saveCatalogProduct(product: CatalogProductInput): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase не настроен');
  }

  const db = getDb();
  const id = product.id || uuidv4();
  const now = new Date().toISOString();
  const name = product.name.trim();
  if (!name) {
    throw new Error('Укажите наименование');
  }

  const type: CatalogProductType =
    product.type === 'service'
      ? 'service'
      : product.type === 'hardware'
        ? 'hardware'
        : 'software';
  const defaultUnit = type === 'service' ? 'услуга' : type === 'hardware' ? 'шт.' : 'лиц.';
  const data: Record<string, unknown> = {
    id,
    type,
    name,
    description: (product.description ?? '').trim(),
    unit: (product.unit ?? defaultUnit).trim() || defaultUnit,
    createdAt: product.createdAt || now,
    updatedAt: now,
  };

  if (type === 'software') {
    data.oneTimePrice = Math.max(0, Number(product.oneTimePrice) || 0);
    data.subscriptionPrice = Math.max(0, Number(product.subscriptionPrice) || 0);
  } else {
    data.price = Math.max(0, Number(product.price) || 0);
  }

  await setDoc(doc(db, COLLECTIONS.productsDirectory, id), data);
  return id;
}

export async function deleteCatalogProduct(id: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase не настроен');
  }
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.productsDirectory, id));
}

/** Засеять демо-каталог, если коллекция пуста */
async function seedDefaultCatalogProducts(): Promise<void> {
  const now = new Date().toISOString();
  const writes: Promise<string>[] = [];

  for (const item of DEFAULT_PRODUCTS_DIRECTORY.software) {
    writes.push(
      saveCatalogProduct({
        id: item.id,
        type: 'software',
        name: item.name,
        description: item.description,
        unit: item.unit,
        oneTimePrice: item.oneTimePrice,
        subscriptionPrice: item.subscriptionPrice,
        createdAt: now,
      })
    );
  }
  for (const item of DEFAULT_PRODUCTS_DIRECTORY.services) {
    writes.push(
      saveCatalogProduct({
        id: item.id,
        type: 'service',
        name: item.name,
        description: item.description,
        unit: item.unit,
        price: item.price,
        createdAt: now,
      })
    );
  }

  await Promise.all(writes);
}

/**
 * Загрузить справочник для редактора КП.
 * Если коллекция пуста — сидирует дефолтные позиции (Аверс. Фронт и т.д.).
 */
export async function loadProductsDirectory(): Promise<ProductsDirectory> {
  if (!isFirebaseConfigured()) {
    const fallback = {
      software: [...DEFAULT_PRODUCTS_DIRECTORY.software],
      services: [...DEFAULT_PRODUCTS_DIRECTORY.services],
      hardware: [...DEFAULT_PRODUCTS_DIRECTORY.hardware],
    };
    setProductsCatalogCache(fallback);
    return fallback;
  }

  let items = await listCatalogProducts();
  if (items.length === 0) {
    await seedDefaultCatalogProducts();
    items = await listCatalogProducts();
  }

  const directory = catalogProductsToDirectory(items);
  setProductsCatalogCache(directory);
  return directory;
}

export async function listContractTemplates(): Promise<ContractTemplate[]> {
  if (!isFirebaseConfigured()) return [];
  const db = getDb();
  const snap = await getDocs(collection(db, COLLECTIONS.contractTemplates));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ContractTemplate));
}

export function getShareUrl(id: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}#/estimate?id=${id}`;
}
