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

/** Marketing presentation slides attached to a commercial proposal PDF */
export type PresentationSlideId = 'about' | 'recognition';

export interface PresentationSlides {
  about: boolean;
  recognition: boolean;
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
  /** Selected KP constructor slides (exported as PDF pages before the estimate table) */
  presentationSlides?: PresentationSlides;
  createdByUid?: string;
  createdByName?: string;
  isDraft?: boolean;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ClientLogoId = 'none' | 'custom';

/** Counterparty / customer company requisites */
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
  /** Base64 data URL of company logo (optional) */
  logoDataUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CompanyInput = Omit<Company, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

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
