export interface PartyLookupResult {
  name: string;
  inn: string;
  kpp: string;
  ogrn: string;
  legalAddress: string;
  director: string;
  directorBasis: string;
}

export function normalizeInn(value: unknown): string;
export function isValidInnLength(inn: string): boolean;
export function mapPartySuggestion(suggestion: unknown): PartyLookupResult;
export function findPartyByInn(
  inn: string,
  config?: { apiKey?: string; secretKey?: string }
): Promise<PartyLookupResult>;
export function createDadataPartyHandler(
  getConfig: () => { apiKey?: string; secretKey?: string }
): (req: unknown, res: unknown) => Promise<void>;
