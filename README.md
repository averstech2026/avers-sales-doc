# Генератор смет Аверс

Веб-приложение для интерактивного составления коммерческих предложений и смет ООО «Аверс Технолоджи».

## Возможности

- Интерактивный редактор сметы с автоматическим пересчётом
- 6 ролей специалистов с настраиваемыми ставками
- Облачное сохранение в Firebase Firestore и шаринг по ссылке
- Экспорт в PDF и Excel в фирменном стиле
- Умный разбор ТЗ (YandexGPT через прокси + ключевые слова + опционально OpenAI)
- Заготовки под договоры и реквизиты контрагентов

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

## OpenAI (опционально)

Добавьте `VITE_OPENAI_API_KEY` в `.env` для AI-разбора через GPT (из РФ обычно нужен VPN или прокси).

## Деплой на GitHub Pages

```bash
npm run deploy
```

Измените `homepage` в `package.json` и `base` в `vite.config.ts` под имя вашего репозитория.

## Структура Firestore

| Коллекция | Назначение |
|-----------|------------|
| `estimates` | Сметы (с полями `clientId`, `contractTemplateId` для будущих договоров) |
| `companies` | Реквизиты контрагентов (в разработке) |
| `contract_templates` | Шаблоны договоров (в разработке) |

## Технологии

React · TypeScript · Vite · Firebase Firestore · ExcelJS · jsPDF
