import { useMemo, useRef, useState } from 'react';
import {
  DEFAULT_MAX_PHOTO_CHARS,
  compressImageFile,
  createDefaultContactsSlideContent,
  type ContactsSlideContent,
} from '../../utils/presentationSlides';
import { EditorBackLink } from '../ui/EditorBackLink';
import { ContactsSlideCanvas } from './ContactsSlideCanvas';
import { ScaledSlideFrame } from './ScaledSlideFrame';

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

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initial),
    [draft, initial]
  );

  const handleExit = () => {
    if (isDirty) {
      const confirmExit = window.confirm(
        'Изменения в слайде не сохранены. Выйти без сохранения?'
      );
      if (!confirmExit) return;
    }
    onCancel();
  };

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
    <div className="slide-editor slide-editor--contacts">
      <div className="slide-editor__toolbar slide-editor__toolbar--sticky">
        <div className="editor-header-left">
          <EditorBackLink label="К слайдам КП" onClick={handleExit} disabled={saving} />
          <h2 className="slide-editor__heading">Редактор: {menuTitle}</h2>
          <p className="slide-editor__hint">
            Завершение сметы: контакты и карта проезда в правой колонке объединённого подвала (рядом с подписями).
          </p>
        </div>
        <div className="slide-editor__toolbar-actions">
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
          <div className="editor-sidebar-card">
            <div className="form-group-custom">
              <label className="field-meta-label" htmlFor="contacts-slide-title">
                Заголовок слайда
              </label>
              <input
                id="contacts-slide-title"
                type="text"
                className="custom-editor-input"
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="Введите заголовок..."
                required
              />
            </div>

            <div className="form-group-custom">
              <label className="field-meta-label" htmlFor="contacts-slide-address">
                Адрес
              </label>
              <textarea
                id="contacts-slide-address"
                className="custom-editor-textarea"
                rows={2}
                value={draft.address}
                onChange={(e) => patch({ address: e.target.value })}
                placeholder="Введите адрес..."
              />
            </div>

            <div className="form-group-custom">
              <label className="field-meta-label" htmlFor="contacts-slide-site">
                Сайт
              </label>
              <input
                id="contacts-slide-site"
                type="text"
                className="custom-editor-input"
                value={draft.site}
                onChange={(e) => patch({ site: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="form-group-custom">
              <label className="field-meta-label" htmlFor="contacts-slide-phone">
                Телефон
              </label>
              <input
                id="contacts-slide-phone"
                type="text"
                className="custom-editor-input"
                value={draft.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                placeholder="+7..."
              />
            </div>

            <div className="form-group-custom">
              <label className="field-meta-label" htmlFor="contacts-slide-email">
                Email
              </label>
              <input
                id="contacts-slide-email"
                type="text"
                className="custom-editor-input"
                value={draft.email}
                onChange={(e) => patch({ email: e.target.value })}
                placeholder="example@..."
              />
            </div>

            <div className="map-upload-group">
              <span className="field-meta-label">Карта проезда (Изображение)</span>
              <div className="map-upload-card">
                <div className="upload-actions-row">
                  <button
                    type="button"
                    className="btn-custom-danger"
                    onClick={() => mapInputRef.current?.click()}
                    disabled={saving}
                  >
                    Загрузить карту
                  </button>
                  <button
                    type="button"
                    className="btn-custom-outline"
                    onClick={() => patch({ mapImageDataUrl: null })}
                    disabled={saving || !draft.mapImageDataUrl}
                  >
                    Сбросить карту
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && <p className="slide-editor__error">{error}</p>}
        </form>

        <div className="slide-editor__preview">
          <div className="slide-editor__preview-label">Живой предпросмотр</div>
          <div className="slide-editor__preview-stage">
            <ScaledSlideFrame variant="contacts">
              <ContactsSlideCanvas content={draft} />
            </ScaledSlideFrame>
          </div>
        </div>
      </div>

      <input
        ref={mapInputRef}
        type="file"
        accept="image/*"
        className="personalization-settings__file-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          void handleMapUpload(file);
        }}
      />
    </div>
  );
}
