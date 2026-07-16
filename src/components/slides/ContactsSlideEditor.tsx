import { useRef, useState } from 'react';
import {
  DEFAULT_MAX_PHOTO_CHARS,
  compressImageFile,
  createDefaultContactsSlideContent,
  type ContactsSlideContent,
} from '../../utils/presentationSlides';
import { ContactsSlideCanvas } from './ContactsSlideCanvas';

interface ContactsSlideEditorProps {
  menuTitle: string;
  initial: ContactsSlideContent;
  saving: boolean;
  onSave: (content: ContactsSlideContent) => Promise<void>;
  onCancel: () => void;
}

export function ContactsSlideEditor({
  menuTitle,
  initial,
  saving,
  onSave,
  onCancel,
}: ContactsSlideEditorProps) {
  const [draft, setDraft] = useState<ContactsSlideContent>(initial);
  const [error, setError] = useState('');
  const mapInputRef = useRef<HTMLInputElement>(null);

  const patch = (partial: Partial<ContactsSlideContent>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
    setError('');
  };

  const handleMapUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, {
        maxWidth: 900,
        maxChars: DEFAULT_MAX_PHOTO_CHARS,
      });
      patch({ mapImageDataUrl: dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить карту');
    }
  };

  const handleReset = () => {
    if (!window.confirm('Сбросить контакты к значениям по умолчанию? Карта сохранится.')) {
      return;
    }
    const defaults = createDefaultContactsSlideContent();
    setDraft({ ...defaults, mapImageDataUrl: draft.mapImageDataUrl });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError('Укажите заголовок слайда');
      return;
    }
    setError('');
    await onSave({
      title: draft.title.trim(),
      address: draft.address.trim(),
      site: draft.site.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      mapImageDataUrl: draft.mapImageDataUrl,
    });
  };

  return (
    <div className="slide-editor">
      <div className="slide-editor__toolbar">
        <div>
          <h2 className="slide-editor__heading">Редактор: {menuTitle}</h2>
          <p className="slide-editor__hint">
            Завершение сметы: контакты и карта проезда под блоком подписей, в стиле документа.
          </p>
        </div>
        <div className="slide-editor__toolbar-actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving}>
            Назад к списку
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleReset} disabled={saving}>
            Сбросить тексты
          </button>
          <button
            type="submit"
            form="contacts-slide-editor-form"
            className="btn btn--primary"
            disabled={saving}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="slide-editor__layout">
        <form
          id="contacts-slide-editor-form"
          className="slide-editor__form"
          onSubmit={(e) => void handleSubmit(e)}
        >
          <label>
            <span>Заголовок</span>
            <input
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              required
            />
          </label>
          <label>
            <span>Адрес</span>
            <textarea
              rows={2}
              value={draft.address}
              onChange={(e) => patch({ address: e.target.value })}
            />
          </label>
          <label>
            <span>Сайт</span>
            <input value={draft.site} onChange={(e) => patch({ site: e.target.value })} />
          </label>
          <label>
            <span>Телефон</span>
            <input value={draft.phone} onChange={(e) => patch({ phone: e.target.value })} />
          </label>
          <label>
            <span>Email</span>
            <input value={draft.email} onChange={(e) => patch({ email: e.target.value })} />
          </label>

          <div className="slide-editor__media">
            <div className="slide-editor__media-card">
              <span className="slide-editor__media-label">Карта проезда</span>
              <div className="slide-editor__media-actions">
                <input
                  ref={mapInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => void handleMapUpload(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => mapInputRef.current?.click()}
                >
                  Загрузить карту
                </button>
                {draft.mapImageDataUrl && (
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => patch({ mapImageDataUrl: null })}
                  >
                    Сбросить к дефолту
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && <p className="slide-editor__error">{error}</p>}
        </form>

        <div className="slide-editor__preview">
          <div className="slide-editor__preview-label">Живой предпросмотр</div>
          <div className="slide-editor__preview-stage">
            <div className="slide-editor__preview-scale">
              <ContactsSlideCanvas content={draft} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
