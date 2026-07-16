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
  ContractTemplate,
  EstimateAuthorMeta,
} from '../types';
import { calculateEstimateTotals } from '../utils/calculator';
import { buildDuplicateEstimate } from '../utils/estimateFactory';
import { COMPANY_DEFAULTS } from '../models/firestore';

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
    data.presentationSlides = {
      about: estimate.presentationSlides.about === true,
      recognition: estimate.presentationSlides.recognition === true,
      kiosk: estimate.presentationSlides.kiosk === true,
      contacts: estimate.presentationSlides.contacts === true,
    };
  }
  if (estimate.isDraft !== undefined) {
    data.isDraft = estimate.isDraft;
  }
  if (estimate.isArchived === true) {
    data.isArchived = true;
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
    const totals = calculateEstimateTotals(data);
    return {
      id: d.id,
      projectName: data.projectName || 'Без названия',
      clientName: data.clientName || '—',
      totalWithVat: totals.totalWithVat,
      updatedAt: toIso(data.updatedAt),
      createdByName: resolveListAuthorName(data, nameByUid),
      isArchived: data.isArchived === true,
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
    data.presentationSlides = {
      about: estimate.presentationSlides.about === true,
      recognition: estimate.presentationSlides.recognition === true,
      kiosk: estimate.presentationSlides.kiosk === true,
      contacts: estimate.presentationSlides.contacts === true,
    };
  }
  if (estimate.isDraft !== undefined) {
    data.isDraft = estimate.isDraft;
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
