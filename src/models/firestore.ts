/**
 * Firestore data models — current and future collections.
 * Used as schema reference for estimates, companies, and contract templates.
 */

export { type Estimate, type Company, type ContractTemplate } from '../types';
export { COLLECTIONS } from '../constants/roles';

/** Default fields for a new company document */
export const COMPANY_DEFAULTS = {
  name: '',
  inn: '',
  kpp: '',
  ogrn: '',
  legalAddress: '',
  bankAccount: '',
  bik: '',
  bankName: '',
  director: '',
  directorBasis: 'Устава',
  logoDataUrl: null as string | null,
} as const;

/** Placeholder variables for contract templates (future) */
export const CONTRACT_PLACEHOLDERS = [
  '{{client_name}}',
  '{{client_inn}}',
  '{{client_kpp}}',
  '{{client_address}}',
  '{{total_cost}}',
  '{{total_cost_words}}',
  '{{project_name}}',
  '{{contract_date}}',
  '{{director_name}}',
] as const;

/** Optional estimate fields linking to future modules */
export interface EstimateLinks {
  clientId?: string;
  contractTemplateId?: string;
}
