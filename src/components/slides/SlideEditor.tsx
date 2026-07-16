import { useRef, useState } from 'react';
import type { PresentationSlideContent, PresentationSlideId } from '../../utils/presentationSlides';
import {
  DEFAULT_MAX_PHOTO_CHARS,
  DEFAULT_MAX_QR_CHARS,
  compressImageFile,
  createDefaultSlideContent,
} from '../../utils/presentationSlides';
import { SlideCanvas } from './SlideCanvas';

interface SlideEditorProps {
  id: Exclude<PresentationSlideId, 'contacts'>;
  menuTitle: string;
  initial: PresentationSlideContent;
  saving: boolean;
  onSave: (content: PresentationSlideContent) => Promise<void>;
  onCancel: () => void;
}

export function SlideEditor({
  id,
  menuTitle,
  initial,
  saving,
  onSave,
  onCancel,
}: SlideEditorProps) {
  const [draft, setDraft] = useState<PresentationSlideContent>(initial);
  const [error, setError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const patch = (partial: Partial<PresentationSlideContent>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
    setError('');
  };

  const handleImageUpload = async (
    file: File | undefined,
    field: 'imageDataUrl' | 'qrImageDataUrl'
  ) => {
    if (!file) return;
    try {
      const isQr = field === 'qrImageDataUrl';
      const dataUrl = await compressImageFile(file, {
        maxWidth: isQr ? 400 : 1100,
        maxChars: isQr ? DEFAULT_MAX_QR_CHARS : DEFAULT_MAX_PHOTO_CHARS,
        preferPng: isQr,
      });
      patch({ [field]: dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить изображение');
    }
  };

  const handleResetTexts = () => {
    if (!window.confirm('Сбросить тексты слайда к значениям по умолчанию? Фото сохранится.')) {
      return;
    }
    const defaults = createDefaultSlideContent(id);
    setDraft({
      ...defaults,
      imageDataUrl: draft.imageDataUrl,
      qrImageDataUrl: draft.qrImageDataUrl,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError('Укажите заголовок слайда');
      return;
    }
    setError('');
    await onSave({
      ...draft,
      title: draft.title.trim(),
      badge: draft.badge.trim(),
      disclaimer: draft.disclaimer.trim(),
      subtitle: draft.subtitle.trim(),
      bulletsText: draft.bulletsText,
      body: draft.body.trim(),
      qrCaption: draft.qrCaption.trim(),
    });
  };

  return (
    <div className="slide-editor">
      <div className="slide-editor__toolbar">
        <div>
          <h2 className="slide-editor__heading">Редактор: {menuTitle}</h2>
          <p className="slide-editor__hint">
            Единая компоновка для всех слайдов. Пустые необязательные поля скрываются на
            превью.
          </p>
        </div>
        <div className="slide-editor__toolbar-actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving}>
            Назад к списку
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleResetTexts} disabled={saving}>
            Сбросить тексты
          </button>
          <button
            type="submit"
            form="slide-editor-form"
            className="btn btn--primary"
            disabled={saving}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="slide-editor__layout">
        <form id="slide-editor-form" className="slide-editor__form" onSubmit={(e) => void handleSubmit(e)}>
          <label className="field">
            <span>Заголовок слайда</span>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              required
            />
          </label>

          <label className="field">
            <span>Плашка (необязательно)</span>
            <textarea
              rows={2}
              value={draft.badge}
              onChange={(e) => patch({ badge: e.target.value })}
              placeholder="Например: основано на AI…"
            />
          </label>

          <label className="field">
            <span>Вводный текст / примечание (под линией)</span>
            <textarea
              rows={3}
              value={draft.disclaimer}
              onChange={(e) => patch({ disclaimer: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Подзаголовок</span>
            <input
              type="text"
              value={draft.subtitle}
              onChange={(e) => patch({ subtitle: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Список (по одному пункту на строку)</span>
            <textarea
              rows={6}
              value={draft.bulletsText}
              onChange={(e) => patch({ bulletsText: e.target.value })}
              placeholder={'пункт 1\nпункт 2'}
            />
          </label>

          <label className="field">
            <span>Абзац (если список пуст)</span>
            <textarea
              rows={4}
              value={draft.body}
              onChange={(e) => patch({ body: e.target.value })}
              placeholder="Текст описания…"
            />
          </label>

          <label className="field">
            <span>Подпись к QR (необязательно)</span>
            <textarea
              rows={2}
              value={draft.qrCaption}
              onChange={(e) => patch({ qrCaption: e.target.value })}
              placeholder="Оставьте пустым, чтобы скрыть QR-блок"
            />
          </label>

          <div className="slide-editor__media">
            <div className="slide-editor__media-card">
              <span className="slide-editor__media-label">Фото справа</span>
              <div className="slide-editor__media-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={saving}
                >
                  Загрузить фото
                </button>
                {draft.imageDataUrl && (
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => patch({ imageDataUrl: null })}
                    disabled={saving}
                  >
                    Сбросить фото
                  </button>
                )}
              </div>
            </div>

            {draft.qrCaption.trim() && (
              <div className="slide-editor__media-card">
                <span className="slide-editor__media-label">QR-код</span>
                <div className="slide-editor__media-actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => qrInputRef.current?.click()}
                    disabled={saving}
                  >
                    Загрузить QR
                  </button>
                  {draft.qrImageDataUrl && (
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => patch({ qrImageDataUrl: null })}
                      disabled={saving}
                    >
                      Сбросить QR
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && <p className="slide-editor__error">{error}</p>}
        </form>

        <div className="slide-editor__preview">
          <div className="slide-editor__preview-label">Живой предпросмотр</div>
          <div className="slide-editor__preview-stage">
            <div className="slide-editor__preview-scale">
              <SlideCanvas id={id} content={draft} />
            </div>
          </div>
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="personalization-settings__file-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          void handleImageUpload(file, 'imageDataUrl');
        }}
      />
      <input
        ref={qrInputRef}
        type="file"
        accept="image/*"
        className="personalization-settings__file-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          void handleImageUpload(file, 'qrImageDataUrl');
        }}
      />
    </div>
  );
}
