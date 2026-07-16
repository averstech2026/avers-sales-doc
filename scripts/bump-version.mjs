import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const versionJsonPath = join(root, 'version.json');
const pkgPath = join(root, 'package.json');
const lockPath = join(root, 'package-lock.json');
const dataTsPath = join(root, 'src', 'constants', 'version.data.ts');

function bumpPatch(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${(patch ?? 0) + 1}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function escapeString(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n')
    .replace(/\t/g, '\\t');
}

function sanitizeNotes(value) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

function formatHistoryEntry(entry) {
  const notes = entry.notes ? `, notes: '${escapeString(entry.notes)}'` : '';
  return `  { version: '${escapeString(entry.version)}', date: '${entry.date}'${notes} },`;
}

function writeVersionDataTs(history) {
  const historyEntries = history.map(formatHistoryEntry).join('\n');
  const content = `/** Автоматически генерируется scripts/bump-version.mjs — не редактировать вручную. */

export const VERSION_HISTORY = [
${historyEntries}
] as const;

const current = VERSION_HISTORY[VERSION_HISTORY.length - 1];

export const APP_VERSION = current.version;
export const APP_RELEASE_DATE = current.date;
`;

  writeFileSync(dataTsPath, content);
}

function syncPackageLock(version) {
  if (!existsSync(lockPath)) {
    return;
  }

  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  lock.version = version;
  if (lock.packages?.['']) {
    lock.packages[''].version = version;
  }
  writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
}

function syncGeneratedFiles(version) {
  const versionData = JSON.parse(readFileSync(versionJsonPath, 'utf8'));
  writeVersionDataTs(versionData.history);

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.version = version;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  syncPackageLock(version);
}

const args = new Set(process.argv.slice(2));

if (args.has('--sync')) {
  const versionData = JSON.parse(readFileSync(versionJsonPath, 'utf8'));
  const current = versionData.history.at(-1);
  if (!current) {
    throw new Error('version.json: history is empty');
  }
  syncGeneratedFiles(current.version);
  console.log(`Synced generated files for v${current.version}`);
  process.exit(0);
}

const versionData = JSON.parse(readFileSync(versionJsonPath, 'utf8'));
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const lastVersion = versionData.history.at(-1)?.version ?? pkg.version;
const newVersion = bumpPatch(lastVersion);
const notes =
  sanitizeNotes(process.env.DEPLOY_NOTES ?? '') || 'Автоматический релиз';

versionData.history.push({
  version: newVersion,
  date: todayIso(),
  notes,
});

writeFileSync(versionJsonPath, `${JSON.stringify(versionData, null, 2)}\n`);
syncGeneratedFiles(newVersion);

console.log(`Version bumped to v${newVersion} (${todayIso()})`);
