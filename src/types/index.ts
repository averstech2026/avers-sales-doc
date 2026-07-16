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

/** Тип коммерческого предложения */
export type EstimateType = 'project' | 'standard';

/** Схема оплаты для позиции типового внедрения */
export type StandardPaymentScheme = 'buyout' | 'rent' | 'fixed';

export type StandardItemKind = 'software' | 'service' | 'hardware';

/** Строка спецификации типового внедрения (ПО и услуги) */
export interface StandardLineItem {
  id: string;
  /** ID из справочника products-directory */
  catalogId: string;
  kind: StandardItemKind;
  name: string;
  description: string;
  /** Индивидуальное примечание к строке КП */
  note?: string;
  paymentScheme: StandardPaymentScheme;
  unitPrice: number;
  quantity: number;
  unit: string;
}

/** Итоги типового внедрения */
export interface StandardEstimateTotals {
  oneTimeSubtotal: number;
  oneTimeWithVat: number;
  recurringMonthly: number;
  vat: number;
  itemCount: number;
  vatRate: number;
}

export interface EstimateAuthorMeta {
  createdByUid: string;
  createdByName: string;
}

/** Marketing presentation slides attached to a commercial proposal PDF */
export type PresentationSlideId = 'about' | 'recognition' | 'kiosk' | 'contacts';

export interface PresentationSlides {
  about: boolean;
  recognition: boolean;
  kiosk: boolean;
  /** Final contacts slide — on by default for new estimates */
  contacts: boolean;
  /** Selected custom slides from the KP library (`slide_*` ids) */
  customIds?: string[];
}

export interface Estimate {
  id?: string;
  /** project — почасовой проект; standard — типовое внедрение ПО и услуг */
  type?: EstimateType;
  projectName: string;
  clientName: string;
  description: string;
  sections: Section[];
  rates: Rates;
  /** Спецификация для type === 'standard' */
  standardItems?: StandardLineItem[];
  /** Ставка НДС для типового внедрения (фиксированно 5%) */
  vatRate?: number;
  /** Кэш итогов для Firestore (пересчитывается при сохранении) */
  oneTimeTotal?: number;
  recurringTotal?: number;
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

/** Тип позиции справочника продуктов и услуг */
export type CatalogProductType = 'software' | 'service' | 'hardware';

/** Запись справочника products_directory в Firestore */
export interface CatalogProduct {
  id: string;
  type: CatalogProductType;
  name: string;
  description: string;
  unit: string;
  /** ПО: цена выкупа */
  oneTimePrice?: number;
  /** ПО: цена аренды в месяц */
  subscriptionPrice?: number;
  /** Услуга / оборудование: фиксированная стоимость */
  price?: number;
  createdAt: string;
  updatedAt: string;
}

export type CatalogProductInput = Omit<CatalogProduct, 'id' | 'createdAt' | 'updatedAt'> & {
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
  /** project — почасовой проект; standard — типовое внедрение */
  type: EstimateType;
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
