import type { IncomingMessage, ServerResponse } from 'http';

export interface YandexConfig {
  apiKey?: string;
  folderId?: string;
}

export function createYandexParseHandler(
  getConfig: () => YandexConfig
): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
