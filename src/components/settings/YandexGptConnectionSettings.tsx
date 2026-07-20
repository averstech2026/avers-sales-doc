import { resolveYandexParseUrl, isYandexParseConfigured } from '../../utils/yandexParseUrl';

function formatEndpointLabel(url: string): string {
  if (url.startsWith('/')) return 'Локальный Vite-прокси';
  try {
    const parsed = new URL(url);
    const id = parsed.pathname.replace(/^\//, '') || '—';
    return id.length > 28 ? `${id.slice(0, 12)}…${id.slice(-8)}` : id;
  } catch {
    return url;
  }
}

export function YandexGptConnectionSettings() {
  const ready = isYandexParseConfigured();
  const endpoint = resolveYandexParseUrl();
  const isLocalProxy = Boolean(endpoint?.startsWith('/'));

  return (
    <div className="cloud-connection-settings">
      <div
        className={`cloud-connection-settings__badge cloud-connection-settings__badge--${ready ? 'connected' : 'local'}`}
      >
        <span className="cloud-connection-settings__badge-dot" aria-hidden="true" />
        {ready ? 'YandexGPT подключён' : 'YandexGPT не настроен'}
      </div>

      {ready && endpoint ? (
        <>
          <p className="cloud-connection-settings__text">
            {isLocalProxy ? (
              <>
                Локальный прокси <code>/api/yandex/parse</code> активен. AI-разбор ТЗ идёт через
                YandexGPT с серверными ключами из <code>.env</code> — они не попадают в браузер.
              </>
            ) : (
              <>
                Прокси YandexGPT доступен. В смете кнопка «AI-разбор ТЗ» отправляет текст в Cloud
                Function, которая вызывает модель и возвращает этапы с оценкой часов.
              </>
            )}
          </p>
          <dl className="cloud-connection-settings__meta">
            <div>
              <dt>{isLocalProxy ? 'Эндпоинт' : 'Cloud Function'}</dt>
              <dd>
                <code title={endpoint}>{formatEndpointLabel(endpoint)}</code>
              </dd>
            </div>
            <div>
              <dt>Модель</dt>
              <dd>
                <code>yandexgpt/latest</code>
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <>
          <p className="cloud-connection-settings__text">
            AI-разбор ТЗ сейчас работает в шаблонном режиме по ключевым словам. Чтобы подключить
            YandexGPT на GitHub Pages, нужен URL Cloud Function в секретах сборки.
          </p>
          <p className="cloud-connection-settings__text">
            Локально добавьте в <code>.env</code> ключи сервисного аккаунта и перезапустите
            dev-сервер:
          </p>
          <pre className="cloud-connection-settings__code">{`YANDEX_API_KEY=...
YANDEX_FOLDER_ID=...
# Прод (после deploy-yandex-parse.ps1):
VITE_YANDEX_PARSE_URL=https://functions.yandexcloud.net/<id>`}</pre>
          <p className="cloud-connection-settings__hint">
            Для продакшена скопируйте <code>VITE_YANDEX_PARSE_URL</code> в GitHub Actions Secrets и
            пересоберите сайт (workflow Deploy).
          </p>
        </>
      )}
    </div>
  );
}
