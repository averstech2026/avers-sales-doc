import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb, isFirebaseConfigured } from '../firebase';
import { COLLECTIONS } from '../constants/roles';
import {
  PRESENTATION_SLIDES_SETTINGS_DOC,
  resolveSlideAssets,
  type PresentationSlideOverrides,
  type ResolvedSlideAssets,
} from '../utils/presentationSlides';

let cachedOverrides: PresentationSlideOverrides | null = null;
let loadPromise: Promise<PresentationSlideOverrides | null> | null = null;

function emptyOverrides(): PresentationSlideOverrides {
  return {
    aboutImageDataUrl: null,
    recognitionImageDataUrl: null,
    qrImageDataUrl: null,
  };
}

function normalizeOverrides(raw: Record<string, unknown> | null): PresentationSlideOverrides {
  if (!raw) return emptyOverrides();
  return {
    aboutImageDataUrl:
      typeof raw.aboutImageDataUrl === 'string' && raw.aboutImageDataUrl.trim()
        ? raw.aboutImageDataUrl
        : null,
    recognitionImageDataUrl:
      typeof raw.recognitionImageDataUrl === 'string' && raw.recognitionImageDataUrl.trim()
        ? raw.recognitionImageDataUrl
        : null,
    qrImageDataUrl:
      typeof raw.qrImageDataUrl === 'string' && raw.qrImageDataUrl.trim()
        ? raw.qrImageDataUrl
        : null,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
    updatedByUid: typeof raw.updatedByUid === 'string' ? raw.updatedByUid : undefined,
    updatedByName: typeof raw.updatedByName === 'string' ? raw.updatedByName : undefined,
  };
}

export function getCachedSlideOverrides(): PresentationSlideOverrides | null {
  return cachedOverrides;
}

export function getResolvedSlideAssetsSync(): ResolvedSlideAssets {
  return resolveSlideAssets(cachedOverrides);
}

export async function loadPresentationSlideOverrides(
  force = false
): Promise<PresentationSlideOverrides> {
  if (!force && cachedOverrides) return cachedOverrides;
  if (!force && loadPromise) {
    const pending = await loadPromise;
    return pending ?? emptyOverrides();
  }

  loadPromise = (async () => {
    if (!isFirebaseConfigured()) {
      cachedOverrides = emptyOverrides();
      return cachedOverrides;
    }

    try {
      const db = getDb();
      const snap = await getDoc(
        doc(db, COLLECTIONS.settings, PRESENTATION_SLIDES_SETTINGS_DOC)
      );
      cachedOverrides = snap.exists()
        ? normalizeOverrides(snap.data() as Record<string, unknown>)
        : emptyOverrides();
      return cachedOverrides;
    } catch {
      cachedOverrides = emptyOverrides();
      return cachedOverrides;
    } finally {
      loadPromise = null;
    }
  })();

  return (await loadPromise) ?? emptyOverrides();
}

export async function ensurePresentationSlideAssets(): Promise<ResolvedSlideAssets> {
  const overrides = await loadPresentationSlideOverrides();
  return resolveSlideAssets(overrides);
}

export async function savePresentationSlideOverrides(
  overrides: PresentationSlideOverrides,
  meta?: { uid?: string; name?: string }
): Promise<PresentationSlideOverrides> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase не настроен');
  }

  const now = new Date().toISOString();
  const data: PresentationSlideOverrides = {
    aboutImageDataUrl: overrides.aboutImageDataUrl?.trim() || null,
    recognitionImageDataUrl: overrides.recognitionImageDataUrl?.trim() || null,
    qrImageDataUrl: overrides.qrImageDataUrl?.trim() || null,
    updatedAt: now,
    updatedByUid: meta?.uid,
    updatedByName: meta?.name,
  };

  const db = getDb();
  await setDoc(doc(db, COLLECTIONS.settings, PRESENTATION_SLIDES_SETTINGS_DOC), data, {
    merge: true,
  });

  cachedOverrides = data;
  return data;
}
