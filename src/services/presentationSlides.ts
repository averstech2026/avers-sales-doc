import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb, isFirebaseConfigured } from '../firebase';
import { COLLECTIONS } from '../constants/roles';
import {
  PRESENTATION_SLIDES_SETTINGS_DOC,
  createCustomSlideEntry,
  createDefaultSlidesLibrary,
  isContactsSlideId,
  isCustomSlideId,
  normalizeSlidesLibrary,
  type AnySlideContent,
  type ContactsSlideContent,
  type CustomPresentationSlide,
  type PresentationSlideContent,
  type PresentationSlideId,
  type PresentationSlidesLibrary,
} from '../utils/presentationSlides';

let cachedLibrary: PresentationSlidesLibrary | null = null;
let loadPromise: Promise<PresentationSlidesLibrary | null> | null = null;

export function getCachedSlidesLibrary(): PresentationSlidesLibrary | null {
  return cachedLibrary;
}

export function getSlidesLibrarySync(): PresentationSlidesLibrary {
  return cachedLibrary ?? createDefaultSlidesLibrary();
}

export async function loadPresentationSlidesLibrary(
  force = false
): Promise<PresentationSlidesLibrary> {
  if (!force && cachedLibrary) return cachedLibrary;
  if (!force && loadPromise) {
    const pending = await loadPromise;
    return pending ?? createDefaultSlidesLibrary();
  }

  loadPromise = (async () => {
    if (!isFirebaseConfigured()) {
      cachedLibrary = createDefaultSlidesLibrary();
      return cachedLibrary;
    }

    try {
      const db = getDb();
      const snap = await getDoc(
        doc(db, COLLECTIONS.settings, PRESENTATION_SLIDES_SETTINGS_DOC)
      );
      cachedLibrary = snap.exists()
        ? normalizeSlidesLibrary(snap.data() as Record<string, unknown>)
        : createDefaultSlidesLibrary();
      return cachedLibrary;
    } catch {
      cachedLibrary = createDefaultSlidesLibrary();
      return cachedLibrary;
    } finally {
      loadPromise = null;
    }
  })();

  return (await loadPromise) ?? createDefaultSlidesLibrary();
}

/** @deprecated Use loadPresentationSlidesLibrary — kept for older call sites */
export async function loadPresentationSlideOverrides(force = false) {
  return loadPresentationSlidesLibrary(force);
}

export async function ensurePresentationSlideAssets() {
  const library = await loadPresentationSlidesLibrary();
  return library;
}

function slidesPayload(library: PresentationSlidesLibrary) {
  return {
    about: library.about,
    recognition: library.recognition,
    kiosk: library.kiosk,
    contacts: library.contacts,
    customSlides: library.customSlides ?? [],
  };
}

export async function addCustomPresentationSlide(
  meta?: { uid?: string; name?: string }
): Promise<{ library: PresentationSlidesLibrary; slide: CustomPresentationSlide }> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase не настроен');
  }

  const current = await loadPresentationSlidesLibrary();
  const slide = createCustomSlideEntry();
  const now = new Date().toISOString();
  const next: PresentationSlidesLibrary = {
    ...current,
    customSlides: [...(current.customSlides ?? []), slide],
    updatedAt: now,
    updatedByUid: meta?.uid,
    updatedByName: meta?.name,
  };

  const db = getDb();
  await setDoc(
    doc(db, COLLECTIONS.settings, PRESENTATION_SLIDES_SETTINGS_DOC),
    {
      slides: slidesPayload(next),
      updatedAt: now,
      updatedByUid: meta?.uid ?? null,
      updatedByName: meta?.name ?? null,
    },
    { merge: true }
  );

  cachedLibrary = next;
  return { library: next, slide };
}

export async function savePresentationSlide(
  id: PresentationSlideId | string,
  content: AnySlideContent,
  meta?: { uid?: string; name?: string }
): Promise<PresentationSlidesLibrary> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase не настроен');
  }

  const current = await loadPresentationSlidesLibrary();
  const now = new Date().toISOString();
  let next: PresentationSlidesLibrary;

  if (isCustomSlideId(id)) {
    const slideContent = content as PresentationSlideContent;
    const customSlides = (current.customSlides ?? []).map((item) =>
      item.id === id
        ? {
            ...item,
            menuTitle: slideContent.title.trim() || item.menuTitle,
            content: slideContent,
          }
        : item
    );
    if (!customSlides.some((item) => item.id === id)) {
      throw new Error('Слайд не найден');
    }
    next = {
      ...current,
      customSlides,
      updatedAt: now,
      updatedByUid: meta?.uid,
      updatedByName: meta?.name,
    };
  } else if (isContactsSlideId(id)) {
    next = {
      ...current,
      contacts: content as ContactsSlideContent,
      updatedAt: now,
      updatedByUid: meta?.uid,
      updatedByName: meta?.name,
    };
  } else {
    next = {
      ...current,
      [id]: content as PresentationSlideContent,
      updatedAt: now,
      updatedByUid: meta?.uid,
      updatedByName: meta?.name,
    };
  }

  const db = getDb();
  await setDoc(
    doc(db, COLLECTIONS.settings, PRESENTATION_SLIDES_SETTINGS_DOC),
    {
      slides: slidesPayload(next),
      updatedAt: now,
      updatedByUid: meta?.uid ?? null,
      updatedByName: meta?.name ?? null,
    },
    { merge: true }
  );

  cachedLibrary = next;
  return next;
}

export async function savePresentationSlidesLibrary(
  library: PresentationSlidesLibrary,
  meta?: { uid?: string; name?: string }
): Promise<PresentationSlidesLibrary> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase не настроен');
  }

  const now = new Date().toISOString();
  const next: PresentationSlidesLibrary = {
    ...library,
    updatedAt: now,
    updatedByUid: meta?.uid,
    updatedByName: meta?.name,
  };

  const db = getDb();
  await setDoc(doc(db, COLLECTIONS.settings, PRESENTATION_SLIDES_SETTINGS_DOC), {
    slides: slidesPayload(next),
    updatedAt: now,
    updatedByUid: meta?.uid ?? null,
    updatedByName: meta?.name ?? null,
  });

  cachedLibrary = next;
  return next;
}
