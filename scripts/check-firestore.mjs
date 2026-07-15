import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
    }
  } catch {
    console.error('Не удалось прочитать .env');
    process.exit(1);
  }
  return env;
}

const env = loadEnv();

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v || v.startsWith('your_'))
  .map(([k]) => k);

if (missing.length) {
  console.error('❌ Firebase не настроен. Пустые переменные:', missing.join(', '));
  process.exit(1);
}

console.log('Проект:', firebaseConfig.projectId);
console.log('Проверка подключения к Firestore...');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

try {
  const q = query(collection(db, 'estimates'), limit(1));
  const snap = await getDocs(q);
  console.log('✅ Firestore подключена успешно');
  console.log(`   Коллекция "estimates": ${snap.size} документ(ов) в выборке (limit 1)`);
  process.exit(0);
} catch (err) {
  const code = err?.code ?? 'unknown';
  const message = err?.message ?? String(err);
  console.error('❌ Ошибка Firestore:', code, message);
  if (code === 'permission-denied') {
    console.error('   Подключение есть, но правила безопасности блокируют чтение.');
  } else if (code === 'unavailable') {
    console.error('   База недоступна — возможно, Firestore не создана в консоли Firebase.');
  }
  process.exit(1);
}
