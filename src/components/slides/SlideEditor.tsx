import { useMemo, useRef, useState } from 'react';
import type { PresentationSlideContent, PresentationSlideId } from '../../utils/presentationSlides';
import {
  DEFAULT_MAX_PHOTO_CHARS,
  DEFAULT_MAX_QR_CHARS,
  SLIDE_BADGE_ICON_OPTIONS,
  compressImageFile,
  createBlankSlideContent,
  createDefaultSlideContent,
  isCustomSlideId,
} from '../../utils/presentationSlides';
import { EditorBackLink } from '../ui/EditorBackLink';
import { SlideCanvas } from './SlideCanvas';
import { ScaledSlideFrame } from './ScaledSlideFrame';

interface SlideEditorProps {
  id: Exclude<PresentationSlideId, 'contacts'> | string;
  menuTitle: string;
  initial: PresentationSlideContent;
  defaultImageFile?: string;
  saving: boolean;
  onSave: (content: PresentationSlideContent) => Promise<void>;
  onCancel: () => void;
}

export function SlideEditor({
  id,
  menuTitle,
  initial,
  defaultImageFile,
  saving,
  onSave,
  onCancel,
}: SlideEditorProps) {
  const [draft, setDraft] = useState<PresentationSlideContent>(initial);
  const [error, setError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

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
    const defaults = isCustomSlideId(id)
      ? createBlankSlideContent()
      : createDefaultSlideContent(id as Exclude<PresentationSlideId, 'contacts'>);
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
      badgeIcon: draft.badgeIcon,
      disclaimer: draft.disclaimer.trim(),
      subtitle: draft.subtitle.trim(),
      bulletsText: draft.bulletsText,
      body: draft.body.trim(),
      qrCaption: draft.qrCaption.trim(),
    });
  };

  return (
    <div className="slide-editor">
      <div className="slide-editor__toolbar slide-editor__toolbar--sticky">
        <div className="editor-header-left">
          <EditorBackLink label="К слайдам КП" onClick={handleExit} disabled={saving} />
          <h2 className="slide-editor__heading">Редактор: {menuTitle}</h2>
          <p className="slide-editor__hint">
            Единая компоновка для всех слайдов. Пустые необязательные поля скрываются на
            превью.
          </p>
        </div>
        <div className="slide-editor__toolbar-actions">
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

          <div className="field">
            <span>Плашка (необязательно)</span>
            <div className="icon-selector-group">
              <span className="field-meta-label">Иконка плашки</span>
              <div className="icon-picker-row" role="radiogroup" aria-label="Иконка плашки">
                {SLIDE_BADGE_ICON_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`icon-picker-btn${
                      draft.badgeIcon === option.id ? ' active' : ''
                    }`}
                    data-icon={option.id}
                    onClick={() => patch({ badgeIcon: option.id })}
                    disabled={saving}
                    role="radio"
                    aria-checked={draft.badgeIcon === option.id}
                    title={option.pickerTitle}
                  >
                    {option.id === 'none' ? (
                      <span className="icon-none-symbol">—</span>
                    ) : (
                      <span className={`icon-preview-badge ${option.pickerBadgeClass}`}>
                        {option.glyph}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={2}
              value={draft.badge}
              onChange={(e) => patch({ badge: e.target.value })}
              placeholder="Например: основано на AI…"
            />
          </div>

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
            <span>Абзац</span>
            <textarea
              rows={4}
              value={draft.body}
              onChange={(e) => patch({ body: e.target.value })}
              placeholder="Текст описания…"
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
            <ScaledSlideFrame>
              <SlideCanvas id={id} content={draft} defaultImageFile={defaultImageFile} />
            </ScaledSlideFrame>
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
