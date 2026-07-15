import { useCallback, useEffect, useRef, useState } from 'react';
import { CornerFrame } from '../components/ui/CornerFrame';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import {
  loadPresentationSlideOverrides,
  savePresentationSlideOverrides,
} from '../services/presentationSlides';
import { buildPdfHtml, pdfStyles, wirePdfImageFallbacks } from '../services/export/pdf';
import type { Estimate } from '../types';
import {
  PRESENTATION_SLIDE_ASSETS,
  compressImageFile,
  getOverrideField,
  resolveSlideAssets,
  type PresentationSlideAssetKey,
  type PresentationSlideOverrides,
  type ResolvedSlideAssets,
} from '../utils/presentationSlides';
import { createNewEstimate } from '../utils/estimateFactory';

const MAX_DATA_URL_CHARS = 900_000;

function previewEstimate(): Estimate {
  return createNewEstimate({
    projectName: 'Демо-проект',
    clientName: 'Клиент',
    presentationSlides: { about: true, recognition: true },
  });
}

export function SlidesPage() {
  const { user, firebaseReady } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [overrides, setOverrides] = useState<PresentationSlideOverrides>({});
  const [assets, setAssets] = useState<ResolvedSlideAssets>(() => resolveSlideAssets(null));
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<PresentationSlideAssetKey | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [pendingKey, setPendingKey] = useState<PresentationSlideAssetKey | null>(null);
  const [previewSlide, setPreviewSlide] = useState<'about' | 'recognition' | null>(null);

  const refreshAssets = useCallback((next: PresentationSlideOverrides) => {
    setOverrides(next);
    setAssets(resolveSlideAssets(next));
  }, []);

  const load = useCallback(async () => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const loaded = await loadPresentationSlideOverrides(true);
      refreshAssets(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить слайды');
      refreshAssets({});
    } finally {
      setLoading(false);
    }
  }, [firebaseReady, refreshAssets]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!previewSlide || !previewRef.current) return;

    const sheet = previewRef.current;
    sheet.replaceChildren();

    const styleEl = document.createElement('style');
    styleEl.textContent = pdfStyles();
    sheet.appendChild(styleEl);

    const estimate = previewEstimate();
    if (previewSlide === 'about') {
      estimate.presentationSlides = { about: true, recognition: false };
    } else {
      estimate.presentationSlides = { about: false, recognition: true };
    }

    sheet.insertAdjacentHTML(
      'beforeend',
      buildPdfHtml(estimate, { slideAssets: assets })
    );
    wirePdfImageFallbacks(sheet);

    // Keep only the selected slide node in preview.
    sheet.querySelectorAll('.pdf-page--document').forEach((el) => el.remove());
    sheet.querySelectorAll('.pdf-page-slide').forEach((el) => {
      if (el.getAttribute('data-slide') !== previewSlide) el.remove();
    });
  }, [previewSlide, assets]);

  const openFilePicker = (key: PresentationSlideAssetKey) => {
    setPendingKey(key);
    setStatus('');
    setError('');
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = pendingKey;
    e.target.value = '';
    setPendingKey(null);
    if (!file || !key || !user) return;

    const def = PRESENTATION_SLIDE_ASSETS.find((item) => item.key === key);
    if (!def) return;

    setSavingKey(key);
    setError('');
    setStatus('');
    try {
      const dataUrl = await compressImageFile(file, def.maxWidth);
      if (dataUrl.length > MAX_DATA_URL_CHARS) {
        throw new Error('Файл слишком большой. Загрузите изображение меньшего размера.');
      }

      const next: PresentationSlideOverrides = {
        ...overrides,
        [getOverrideField(key)]: dataUrl,
      };
      const saved = await savePresentationSlideOverrides(next, {
        uid: user.uid,
        name: user.fullName || user.displayName || user.email,
      });
      refreshAssets(saved);
      setStatus(`Фото «${def.title}» обновлено`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить изображение');
    } finally {
      setSavingKey(null);
    }
  };

  const handleReset = async (key: PresentationSlideAssetKey) => {
    if (!user) return;
    const def = PRESENTATION_SLIDE_ASSETS.find((item) => item.key === key);
    if (!def) return;
    if (!window.confirm(`Вернуть стандартное изображение для «${def.title}»?`)) return;

    setSavingKey(key);
    setError('');
    setStatus('');
    try {
      const next: PresentationSlideOverrides = {
        ...overrides,
        [getOverrideField(key)]: null,
      };
      const saved = await savePresentationSlideOverrides(next, {
        uid: user.uid,
        name: user.fullName || user.displayName || user.email,
      });
      refreshAssets(saved);
      setStatus(`Для «${def.title}» восстановлено изображение по умолчанию`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сбросить изображение');
    } finally {
      setSavingKey(null);
    }
  };

  const srcFor = (key: PresentationSlideAssetKey): string => {
    if (key === 'about') return assets.aboutImageSrc;
    if (key === 'recognition') return assets.recognitionImageSrc;
    return assets.qrImageSrc;
  };

  const isCustom = (key: PresentationSlideAssetKey): boolean => {
    if (key === 'about') return assets.aboutIsCustom;
    if (key === 'recognition') return assets.recognitionIsCustom;
    return assets.qrIsCustom;
  };

  return (
    <div className="page slides-page">
      <header className="page-header">
        <div>
          <h1>Слайды КП</h1>
          <p className="page-header__sub">
            Презентационные блоки конструктора коммерческого предложения: просмотр и замена
            фотографий.
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
              {PRESENTATION_SLIDE_ASSETS.map((item) => {
                const custom = isCustom(item.key);
                const busy = savingKey === item.key;
                return (
                  <article key={item.key} className="slide-asset-card">
                    <div className="slide-asset-card__preview">
                      <img src={srcFor(item.key)} alt={item.title} />
                      {custom && <span className="slide-asset-card__badge">Своё фото</span>}
                    </div>
                    <div className="slide-asset-card__body">
                      <h2 className="slide-asset-card__title">{item.title}</h2>
                      <p className="slide-asset-card__desc">{item.description}</p>
                      <p className="slide-asset-card__hint">{item.hint}</p>
                      <div className="slide-asset-card__actions">
                        {(item.key === 'about' || item.key === 'recognition') && (
                          <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={() =>
                              setPreviewSlide(item.key === 'about' ? 'about' : 'recognition')
                            }
                            disabled={busy}
                          >
                            Предпросмотр слайда
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn--primary"
                          onClick={() => openFilePicker(item.key)}
                          disabled={busy}
                        >
                          {busy ? 'Сохранение…' : 'Обновить фото'}
                        </button>
                        {custom && (
                          <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={() => void handleReset(item.key)}
                            disabled={busy}
                          >
                            Сбросить
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </CornerFrame>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="personalization-settings__file-input"
        onChange={(e) => void handleFileChange(e)}
      />

      <Modal
        open={previewSlide !== null}
        onClose={() => setPreviewSlide(null)}
        title={
          previewSlide === 'about'
            ? 'Предпросмотр: О компании'
            : 'Предпросмотр: Распознавание еды'
        }
        preview
      >
        <div className="slides-preview-modal">
          <div className="slides-preview-modal__viewport">
            <div className="slides-preview-modal__sheet" ref={previewRef} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
