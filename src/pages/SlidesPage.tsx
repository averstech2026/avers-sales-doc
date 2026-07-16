import { useCallback, useEffect, useState } from 'react';
import { CornerFrame } from '../components/ui/CornerFrame';
import { Modal } from '../components/ui/Modal';
import { SlideCanvas } from '../components/slides/SlideCanvas';
import { ScaledSlideFrame } from '../components/slides/ScaledSlideFrame';
import { SlideEditor } from '../components/slides/SlideEditor';
import { ContactsSlideEditor } from '../components/slides/ContactsSlideEditor';
import { useAuth } from '../context/AuthContext';
import {
  addCustomPresentationSlide,
  loadPresentationSlidesLibrary,
  savePresentationSlide,
} from '../services/presentationSlides';
import {
  PRESENTATION_SLIDE_DEFS,
  createDefaultSlidesLibrary,
  isContactsSlideId,
  isCustomSlideId,
  slideHasCustomImage,
  type AnySlideContent,
  type ContactsSlideContent,
  type CustomPresentationSlide,
  type PresentationSlideContent,
  type PresentationSlideId,
  type PresentationSlidesLibrary,
} from '../utils/presentationSlides';

type EditingSlideId = PresentationSlideId | string;

function AddSlideCard({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="slide-asset-card slide-asset-card--add"
      id="createNewSlideBtn"
      onClick={onClick}
      disabled={disabled}
      aria-label="Добавить слайд по стандартному шаблону"
    >
      <div className="add-slide-trigger-inner">
        <div className="plus-icon-circle" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <span className="add-slide-text">Добавить слайд</span>
        <span className="add-slide-subtext">по стандартному шаблону</span>
      </div>
    </button>
  );
}

function SlideAssetCard({
  id,
  menuTitle,
  menuDescription,
  content,
  defaultImageFile,
  onEdit,
  onPreview,
}: {
  id: EditingSlideId;
  menuTitle: string;
  menuDescription: string;
  content: AnySlideContent;
  defaultImageFile?: string;
  onEdit: () => void;
  onPreview: () => void;
}) {
  const custom = slideHasCustomImage(content);
  const titleHint = isContactsSlideId(id)
    ? (content as ContactsSlideContent).address || '—'
    : (content as PresentationSlideContent).title || '—';

  return (
    <article className="slide-asset-card">
      <div
        className={`slide-asset-card__preview slide-asset-card__preview--canvas${
          isContactsSlideId(id) ? ' slide-asset-card__preview--contacts' : ''
        }`}
      >
        <div
          className={`slide-asset-card__mini${
            isContactsSlideId(id) ? ' slide-asset-card__mini--contacts' : ''
          }`}
        >
          <SlideCanvas id={id} content={content} defaultImageFile={defaultImageFile} />
        </div>
        {custom && (
          <span className="slide-asset-card__badge">
            {isContactsSlideId(id) ? 'Своя карта' : 'Своё фото'}
          </span>
        )}
      </div>
      <div className="slide-asset-card__body">
        <h2 className="slide-asset-card__title">{menuTitle}</h2>
        <p className="slide-asset-card__desc">{menuDescription}</p>
        <p className="slide-asset-card__hint">
          {isContactsSlideId(id) ? 'Адрес: ' : 'Заголовок: '}
          {titleHint}
        </p>
        <div className="slide-asset-card__actions">
          <button type="button" className="btn-action-edit" onClick={onEdit}>
            Редактировать
          </button>
          <button type="button" className="btn-action-view" onClick={onPreview}>
            <svg className="view-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Просмотр</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export function SlidesPage() {
  const { user, firebaseReady } = useAuth();
  const [library, setLibrary] = useState<PresentationSlidesLibrary>(() =>
    createDefaultSlidesLibrary()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [previewingId, setPreviewingId] = useState<EditingSlideId | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [editingId, setEditingId] = useState<EditingSlideId | null>(null);

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

  const handleCreateSlide = async () => {
    if (!user) {
      setError('Войдите в систему, чтобы создавать слайды');
      return;
    }
    setCreating(true);
    setError('');
    setStatus('');
    try {
      const { library: next, slide } = await addCustomPresentationSlide({
        uid: user.uid,
        name: user.fullName || user.displayName || user.email,
      });
      setLibrary(next);
      setStatus('Слайд создан');
      setEditingId(slide.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать слайд');
    } finally {
      setCreating(false);
    }
  };

  if (editingId) {
    if (isContactsSlideId(editingId)) {
      const def = PRESENTATION_SLIDE_DEFS.find((item) => item.id === 'contacts')!;
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

    if (isCustomSlideId(editingId)) {
      const custom = (library.customSlides ?? []).find((item) => item.id === editingId);
      if (!custom) {
        return (
          <div className="page slides-page">
            <p className="slides-registry__error">Слайд не найден</p>
            <button type="button" className="btn btn--ghost" onClick={() => setEditingId(null)}>
              Назад к списку
            </button>
          </div>
        );
      }
      return (
        <div className="page slides-page">
          <SlideEditor
            key={editingId}
            id={editingId}
            menuTitle={custom.menuTitle}
            initial={custom.content}
            defaultImageFile={custom.defaultImageFile}
            saving={saving}
            onSave={(content) => handleSave(content)}
            onCancel={() => setEditingId(null)}
          />
          {error && <p className="slides-registry__error">{error}</p>}
        </div>
      );
    }

    const def = PRESENTATION_SLIDE_DEFS.find((item) => item.id === editingId)!;
    return (
      <div className="page slides-page">
        <SlideEditor
          key={editingId}
          id={editingId as Exclude<PresentationSlideId, 'contacts'>}
          menuTitle={def.menuTitle}
          initial={library[editingId as keyof PresentationSlidesLibrary] as PresentationSlideContent}
          saving={saving}
          onSave={(content) => handleSave(content)}
          onCancel={() => setEditingId(null)}
        />
        {error && <p className="slides-registry__error">{error}</p>}
      </div>
    );
  }

  const builtinDefs = PRESENTATION_SLIDE_DEFS.filter((def) => !isContactsSlideId(def.id));
  const contactsDef = PRESENTATION_SLIDE_DEFS.find((def) => isContactsSlideId(def.id))!;
  const customSlides = library.customSlides ?? [];
  const previewSlide = (() => {
    if (!previewingId) return null;
    if (isContactsSlideId(previewingId)) {
      return {
        id: previewingId,
        title: contactsDef.menuTitle,
        content: library.contacts as AnySlideContent,
        defaultImageFile: contactsDef.defaultImageFile,
      };
    }
    if (isCustomSlideId(previewingId)) {
      const custom = customSlides.find((item) => item.id === previewingId);
      if (!custom) return null;
      return {
        id: custom.id,
        title: custom.menuTitle,
        content: custom.content as AnySlideContent,
        defaultImageFile: custom.defaultImageFile,
      };
    }
    const def = PRESENTATION_SLIDE_DEFS.find((item) => item.id === previewingId);
    if (!def) return null;
    return {
      id: def.id,
      title: def.menuTitle,
      content: library[def.id] as AnySlideContent,
      defaultImageFile: def.defaultImageFile,
    };
  })();

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
              {builtinDefs.map((def) => {
                const content = library[def.id] as PresentationSlideContent;
                return (
                  <SlideAssetCard
                    key={def.id}
                    id={def.id}
                    menuTitle={def.menuTitle}
                    menuDescription={def.menuDescription}
                    content={content}
                    onEdit={() => {
                      setStatus('');
                      setEditingId(def.id);
                    }}
                  onPreview={() => setPreviewingId(def.id)}
                  />
                );
              })}

              {customSlides.map((slide: CustomPresentationSlide) => (
                <SlideAssetCard
                  key={slide.id}
                  id={slide.id}
                  menuTitle={slide.menuTitle}
                  menuDescription={slide.menuDescription}
                  content={slide.content}
                  defaultImageFile={slide.defaultImageFile}
                  onEdit={() => {
                    setStatus('');
                    setEditingId(slide.id);
                  }}
                  onPreview={() => setPreviewingId(slide.id)}
                />
              ))}

              <AddSlideCard disabled={creating || !user} onClick={() => void handleCreateSlide()} />

              <SlideAssetCard
                id={contactsDef.id}
                menuTitle={contactsDef.menuTitle}
                menuDescription={contactsDef.menuDescription}
                content={library.contacts}
                onEdit={() => {
                  setStatus('');
                  setEditingId(contactsDef.id);
                }}
                onPreview={() => setPreviewingId(contactsDef.id)}
              />
            </div>
          </>
        )}
      </CornerFrame>

      <Modal
        open={Boolean(previewSlide)}
        onClose={() => setPreviewingId(null)}
        title={previewSlide ? `Предпросмотр: ${previewSlide.title}` : 'Предпросмотр'}
        preview
      >
        {previewSlide && (
          <div className="slide-quick-preview">
            <ScaledSlideFrame
              variant={isContactsSlideId(previewSlide.id) ? 'contacts' : 'standard'}
            >
              <SlideCanvas
                id={previewSlide.id}
                content={previewSlide.content}
                defaultImageFile={previewSlide.defaultImageFile}
              />
            </ScaledSlideFrame>
          </div>
        )}
      </Modal>
    </div>
  );
}
