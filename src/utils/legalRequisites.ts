import type { OrgSettings } from './personalization';
import { loadOrgSettings } from './personalization';

/** Default legal requisites for ООО «Аверс Технолоджи» (used when personalization is empty). */
export const AVERS_LEGAL_REQUISITES = {
  fullName: 'ООО «Аверс Технолоджи»',
  legalAddress: '105264, г. Москва, Щелковское шоссе, д. 5, стр. 1, офис 726',
  inn: '7719460280',
  kpp: '771901001',
  ogrn: '1167746979986',
  bankAccount: '40702810900000000000',
  bankName: 'АО "Тинькофф Банк", г. Москва',
  bik: '044525974',
  corrAccount: '30101810145250000974',
} as const;

export interface LegalRequisites {
  fullName: string;
  legalAddress: string;
  inn: string;
  kpp: string;
  ogrn: string;
  bankAccount: string;
  bankName: string;
  bik: string;
  corrAccount: string;
}

function pick(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim() ?? '';
  return trimmed || fallback;
}

/** Resolve printable requisites: personalization overrides, then Avers defaults. */
export function resolveLegalRequisites(org?: OrgSettings | null): LegalRequisites {
  const settings = org ?? loadOrgSettings();
  return {
    fullName: pick(settings.fullName, AVERS_LEGAL_REQUISITES.fullName),
    legalAddress: pick(settings.legalAddress, AVERS_LEGAL_REQUISITES.legalAddress),
    inn: pick(settings.inn, AVERS_LEGAL_REQUISITES.inn),
    kpp: pick(settings.kpp, AVERS_LEGAL_REQUISITES.kpp),
    ogrn: pick(settings.ogrn, AVERS_LEGAL_REQUISITES.ogrn),
    bankAccount: pick(settings.bankAccount, AVERS_LEGAL_REQUISITES.bankAccount),
    bankName: pick(settings.bankName, AVERS_LEGAL_REQUISITES.bankName),
    bik: pick(settings.bik, AVERS_LEGAL_REQUISITES.bik),
    corrAccount: AVERS_LEGAL_REQUISITES.corrAccount,
  };
}

/** Default ON when the field is missing (legacy estimates). */
export function isLegalRequisitesIncluded(
  includeLegalRequisites: boolean | undefined
): boolean {
  return includeLegalRequisites !== false;
}
