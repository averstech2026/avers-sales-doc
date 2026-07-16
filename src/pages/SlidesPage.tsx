import { useCallback, useEffect, useState } from 'react';
import { CornerFrame } from '../components/ui/CornerFrame';
import { SlideCanvas } from '../components/slides/SlideCanvas';
import { SlideEditor } from '../components/slides/SlideEditor';
import { ContactsSlideEditor } from '../components/slides/ContactsSlideEditor';
import { useAuth } from '../context/AuthContext';
import {
  loadPresentationSlidesLibrary,
  savePresentationSlide,
} from '../services/presentationSlides';
import {
  PRESENTATION_SLIDE_DEFS,
  createDefaultSlidesLibrary,
  isContactsSlideId,
  slideHasCustomImage,
  type AnySlideContent,
  type ContactsSlideContent,
  type PresentationSlideContent,
  type PresentationSlideId,
  type PresentationSlidesLibrary,
} from '../utils/presentationSlides';

export function SlidesPage() {
  const { user, firebaseReady } = useAuth();
  const [library, setLibrary] = useState<PresentationSlidesLibrary>(() =>
    createDefaultSlidesLibrary()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [editingId, setEditingId] = useState<PresentationSlideId | null>(null);

  const load = useCallback(async () => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const loaded = await loadPresentationSlidesLibrary(true);
      setLibrary(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить слайды');
      setLibrary(createDefaultSlidesLibrary());
    } finally {
      setLoading(false);
    }
  }, [firebaseReady]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (content: AnySlideContent) => {
    if (!user || !editingId) return;
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const next = await savePresentationSlide(editingId, content, {
        uid: user.uid,
        name: user.fullName || user.displayName || user.email,
      });
      setLibrary(next);
      setStatus('Слайд сохранён');
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить слайд');
    } finally {
      setSaving(false);
    }
  };

  if (editingId) {
    const def = PRESENTATION_SLIDE_DEFS.find((item) => item.id === editingId)!;
    if (isContactsSlideId(editingId)) {
      return (
        <div className="page slides-page">
          <ContactsSlideEditor
            key={editingId}
            menuTitle={def.menuTitle}
            initial={library.contacts}
            saving={saving}
            onSave={(content) => handleSave(content)}
            onCancel={() => setEditingId(null)}
          />
          {error && <p className="slides-registry__error">{error}</p>}
        </div>
      );
    }

    return (
      <div className="page slides-page">
        <SlideEditor
          key={editingId}
          id={editingId}
          menuTitle={def.menuTitle}
          initial={library[editingId] as PresentationSlideContent}
          saving={saving}
          onSave={(content) => handleSave(content)}
          onCancel={() => setEditingId(null)}
        />
        {error && <p className="slides-registry__error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="page slides-page">
      <header className="page-header">
        <div>
          <h1>Слайды КП</h1>
          <p className="page-header__sub">
            Редактор презентационных слайдов: стандартная компоновка и финальный слайд «Контакты».
          </p>
        </div>
      </header>

      <CornerFrame className="slides-registry">
        {loading ? (
          <p className="muted">Загрузка…</p>
        ) : (
          <>
            {error && <p className="slides-registry__error">{error}</p>}
            {status && <p className="slides-registry__status">{status}</p>}

            <div className="slides-registry__grid">
              {PRESENTATION_SLIDE_DEFS.map((def) => {
                const content = library[def.id];
                const custom = slideHasCustomImage(content);
                const titleHint = isContactsSlideId(def.id)
                  ? (content as ContactsSlideContent).address || '—'
                  : (content as PresentationSlideContent).title || '—';
                return (
                  <article key={def.id} className="slide-asset-card">
                    <div className="slide-asset-card__preview slide-asset-card__preview--canvas">
                      <div className="slide-asset-card__mini">
                        <SlideCanvas id={def.id} content={content} />
                      </div>
                      {custom && (
                        <span className="slide-asset-card__badge">
                          {isContactsSlideId(def.id) ? 'Своя карта' : 'Своё фото'}
                        </span>
                      )}
                    </div>
                    <div className="slide-asset-card__body">
                      <h2 className="slide-asset-card__title">{def.menuTitle}</h2>
                      <p className="slide-asset-card__desc">{def.menuDescription}</p>
                      <p className="slide-asset-card__hint">
                        {isContactsSlideId(def.id) ? 'Адрес: ' : 'Заголовок: '}
                        {titleHint}
                      </p>
                      <div className="slide-asset-card__actions">
                        <button
                          type="button"
                          className="btn btn--primary"
                          onClick={() => {
                            setStatus('');
                            setEditingId(def.id);
                          }}
                        >
                          Редактировать
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </CornerFrame>
    </div>
  );
}
