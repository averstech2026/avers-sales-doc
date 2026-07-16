# Генератор смет Аверс

Веб-приложение для интерактивного составления коммерческих предложений и смет ООО «Аверс Технолоджи».

## Возможности

- Интерактивный редактор сметы с автоматическим пересчётом
- 6 ролей специалистов с настраиваемыми ставками
- Облачное сохранение в Firebase Firestore и шаринг по ссылке
- Экспорт в PDF и Excel в фирменном стиле
- Умный разбор ТЗ (YandexGPT через прокси + ключевые слова + опционально OpenAI)
- Справочник контрагентов (реквизиты + логотип) с подстановкой в смету
- Заготовки под шаблоны договоров

## Быстрый старт

```bash
npm install
cp .env.example .env
# Заполните Firebase-конфигурацию в .env
npm run dev
```

## Firebase

1. Создайте проект в [Firebase Console](https://console.firebase.google.com/)
2. Включите Firestore Database (режим test или настройте правила)
3. Скопируйте конфигурацию Web App в `.env`

Пример правил Firestore для разработки:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> Для продакшена настройте аутентификацию и ограничьте доступ.

## YandexGPT (рекомендуется для РФ)

1. Скопируйте из bringhome (или создайте в [Yandex Cloud](https://console.cloud.yandex.ru/)):
   - `YANDEX_API_KEY` — API-ключ сервисного аккаунта с ролью `ai.languageModels.user`
   - `YANDEX_FOLDER_ID` — ID каталога
2. Добавьте их в `.env` (без префикса `VITE_` — ключи остаются на сервере).
3. Локально: `npm run dev` — запросы идут через Vite-прокси `/api/yandex/parse`.
4. Для GitHub Pages задеплойте Cloud Function:

```powershell
.\scripts\deploy-yandex-parse.ps1
```

Скрипт выведет `VITE_YANDEX_PARSE_URL` — добавьте в `.env` и пересоберите.

Если YandexGPT недоступен, сработает шаблонный разбор по ключевым словам.

## DaData (заполнение компании по ИНН)

1. Зарегистрируйтесь на [dadata.ru](https://dadata.ru/) и скопируйте **API-ключ** (Secret для findById обычно не обязателен).
2. В `.env`:
   ```
   DADATA_API_KEY=ваш_ключ
   ```
3. Локально: `npm run dev` — запросы идут через `/api/dadata/party`.
4. Для GitHub Pages задеплойте функцию:
   ```powershell
   .\scripts\deploy-dadata-party.ps1
   ```
   Добавьте выведенный `VITE_DADATA_PARTY_URL` в `.env` и пересоберите.

В форме компании: введите ИНН → «Заполнить по ИНН» (название, КПП, ОГРН, адрес, руководитель). Банковские реквизиты по-прежнему вручную.

## OpenAI (опционально)

Добавьте `VITE_OPENAI_API_KEY` в `.env` для AI-разбора через GPT (из РФ обычно нужен VPN или прокси).

## Деплой на GitHub Pages

При пуше в `main` сайт собирается в GitHub Actions (`.github/workflows/deploy.yml`). Файл `.env` в репозиторий не попадает — ключи нужно добавить в **Settings → Secrets and variables → Actions** репозитория:

| Secret | Обязательно |
|--------|-------------|
| `VITE_FIREBASE_API_KEY` | да |
| `VITE_FIREBASE_AUTH_DOMAIN` | да |
| `VITE_FIREBASE_PROJECT_ID` | да |
| `VITE_FIREBASE_STORAGE_BUCKET` | да |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | да |
| `VITE_FIREBASE_APP_ID` | да |
| `VITE_SUPERADMIN_EMAILS` | нет |
| `VITE_YANDEX_PARSE_URL` | нет |
| `VITE_DADATA_PARTY_URL` | нет |

Скопируйте значения из локального `.env` (те же строки с префиксом `VITE_`). После добавления секретов сделайте пустой коммит или **Re-run** последнего workflow в Actions.

Локальный деплой вручную:

```bash
npm run deploy
```

Измените `homepage` в `package.json` и `base` в `vite.config.ts` под имя вашего репозитория.

## Структура Firestore

| Коллекция | Назначение |
|-----------|------------|
| `estimates` | Сметы (с полями `clientId`, `contractTemplateId` для будущих договоров) |
| `companies` | Справочник контрагентов (реквизиты, логотип) |
| `contract_templates` | Шаблоны договоров (в разработке) |

## Технологии

React · TypeScript · Vite · Firebase Firestore · ExcelJS · jsPDF
