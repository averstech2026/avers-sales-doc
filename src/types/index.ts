export type RoleId =
  | 'consultant'
  | 'architect'
  | 'backend'
  | 'frontend'
  | 'engineer'
  | 'designer';

export interface Role {
  id: RoleId;
  name: string;
  shortName: string;
  defaultRate: number;
}

export interface RoleHours {
  consultant: number;
  architect: number;
  backend: number;
  frontend: number;
  engineer: number;
  designer: number;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  hours: RoleHours;
}

export interface Section {
  id: string;
  name: string;
  tasks: Task[];
}

export interface Rates {
  consultant: number;
  architect: number;
  backend: number;
  frontend: number;
  engineer: number;
  designer: number;
}

export interface SectionTotals {
  hours: RoleHours;
  cost: number;
}

export interface EstimateTotals {
  hours: RoleHours;
  totalHours: number;
  subtotal: number;
  vat: number;
  totalWithVat: number;
}

export interface EstimateAuthorMeta {
  createdByUid: string;
  createdByName: string;
}

export interface Estimate {
  id?: string;
  projectName: string;
  clientName: string;
  description: string;
  sections: Section[];
  rates: Rates;
  clientLogoId?: ClientLogoId;
  clientLogoCustom?: string | null;
  clientId?: string;
  contractTemplateId?: string;
  createdByUid?: string;
  createdByName?: string;
  isDraft?: boolean;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ClientLogoId = 'none' | 'vzlp' | 'gazprom' | 'rosatom' | 'custom';

/** Future: counterparty requisites */
export interface Company {
  id: string;
  name: string;
  inn: string;
  kpp: string;
  ogrn: string;
  legalAddress: string;
  bankAccount: string;
  bik: string;
  bankName: string;
  director: string;
  directorBasis: string;
  createdAt: string;
  updatedAt: string;
}

/** Future: contract templates */
export interface ContractTemplate {
  id: string;
  name: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface EstimateListItem {
  id: string;
  projectName: string;
  clientName: string;
  totalWithVat: number;
  updatedAt: string;
  createdByName?: string;
  isArchived?: boolean;
}

export interface AiParseResult {
  sections: Array<{
    name: string;
    tasks: Array<{
      name: string;
      description: string;
      hours: Partial<RoleHours>;
    }>;
  }>;
}
