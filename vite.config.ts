import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createYandexParseHandler } from './functions/yandexGpt.js';
import { createDadataPartyHandler } from './functions/dadataParty.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'yandex-parse-api',
        configureServer(server) {
          const handler = createYandexParseHandler(() => ({
            apiKey: env.YANDEX_API_KEY,
            folderId: env.YANDEX_FOLDER_ID,
          }));

          server.middlewares.use('/api/yandex/parse', (req, res) => {
            handler(req, res);
          });
        },
      },
      {
        name: 'dadata-party-api',
        configureServer(server) {
          const handler = createDadataPartyHandler(() => ({
            apiKey: env.DADATA_API_KEY,
            secretKey: env.DADATA_SECRET_KEY,
          }));

          server.middlewares.use('/api/dadata/party', (req, res) => {
            handler(req, res);
          });
        },
      },
    ],
    base: mode === 'production' ? '/avers-sales-doc/' : '/',
  };
});
