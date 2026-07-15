import { firebaseConfig, isFirebaseConfigured } from '../../firebase';

export type CloudConnectionStatus = 'checking' | 'local' | 'connected' | 'error';

interface CloudConnectionSettingsProps {
  status: CloudConnectionStatus;
}

const ENV_TEMPLATE = `VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id`;

export function CloudConnectionSettings({ status }: CloudConnectionSettingsProps) {
  const firebaseReady = isFirebaseConfigured();

  return (
    <div className="cloud-connection-settings">
      <div className={`cloud-connection-settings__badge cloud-connection-settings__badge--${status}`}>
        <span className="cloud-connection-settings__badge-dot" aria-hidden="true" />
        {status === 'checking' && 'Проверка подключения…'}
        {status === 'connected' && 'Firestore подключена'}
        {status === 'local' && 'Локальный режим'}
        {status === 'error' && 'Ошибка подключения'}
      </div>

      {status === 'connected' && (
        <>
          <p className="cloud-connection-settings__text">
            База данных Firestore подключена. Все сохранённые сметы синхронизируются в облаке и
            доступны по ссылке для коллег.
          </p>
          {firebaseConfig.projectId && (
            <dl className="cloud-connection-settings__meta">
              <div>
                <dt>Проект Firebase</dt>
                <dd>
                  <code>{firebaseConfig.projectId}</code>
                </dd>
              </div>
            </dl>
          )}
        </>
      )}

      {status === 'local' && (
        <>
          <p className="cloud-connection-settings__text">
            Сейчас приложение работает без облачной синхронизации. Сметы можно создавать и
            экспортировать локально, но реестр «Последние сметы» и совместный доступ недоступны.
          </p>
          <p className="cloud-connection-settings__text">
            Чтобы подключить Firestore, создайте файл <code>.env</code> в корне проекта и укажите
            ключи из консоли Firebase:
          </p>
          <pre className="cloud-connection-settings__code">{ENV_TEMPLATE}</pre>
          <p className="cloud-connection-settings__hint">
            После сохранения файла перезапустите dev-сервер (<code>npm run dev</code>) или
            пересоберите приложение.
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <p className="cloud-connection-settings__text">
            Firebase настроен, но подключение к Firestore не удалось. Проверьте правила доступа,
            интернет-соединение и корректность ключей в <code>.env</code>.
          </p>
          {firebaseReady && firebaseConfig.projectId && (
            <dl className="cloud-connection-settings__meta">
              <div>
                <dt>Проект Firebase</dt>
                <dd>
                  <code>{firebaseConfig.projectId}</code>
                </dd>
              </div>
            </dl>
          )}
        </>
      )}

      {status === 'checking' && (
        <p className="cloud-connection-settings__text muted">
          Проверяем доступность базы данных…
        </p>
      )}
    </div>
  );
}
