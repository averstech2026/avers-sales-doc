import { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import type { Estimate } from '../../types';
import {
  buildPdfHtml,
  exportToPdf,
  pdfStyles,
  wirePdfImageFallbacks,
  type PdfExportOptions,
} from '../../services/export/pdf';
import { loadPresentationSlidesLibrary } from '../../services/presentationSlides';
import { hasAnyPresentationSlideSelected } from '../../utils/presentationSlides';

interface PdfPreviewModalProps {
  open: boolean;
  estimate: Estimate;
  options: PdfExportOptions;
  onClose: () => void;
  onExported?: () => void;
  onError?: () => void;
}

function hasAnySlide(estimate: Estimate): boolean {
  return hasAnyPresentationSlideSelected(estimate.presentationSlides);
}

export function PdfPreviewModal({
  open,
  estimate,
  options,
  onClose,
  onExported,
  onError,
}: PdfPreviewModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const slidesOn = hasAnySlide(estimate);

  useEffect(() => {
    if (!open || !sheetRef.current) return;
    const sheet = sheetRef.current;
    let cancelled = false;

    const render = async () => {
      const slidesLibrary = await loadPresentationSlidesLibrary();
      if (cancelled || !sheetRef.current) return;

      sheet.replaceChildren();
      const styleEl = document.createElement('style');
      styleEl.textContent = pdfStyles();
      sheet.appendChild(styleEl);
      sheet.insertAdjacentHTML(
        'beforeend',
        buildPdfHtml(estimate, { ...options, slidesLibrary })
      );
      wirePdfImageFallbacks(sheet);
    };

    void render();
    return () => {
      cancelled = true;
    };
  }, [open, estimate, options]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportToPdf(estimate, options);
      onExported?.();
      onClose();
    } catch {
      onError?.();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Предпросмотр PDF" preview>
      <div className="pdf-preview">
        <div className="pdf-preview__toolbar">
          <p className="pdf-preview__hint">
            Так будет выглядеть коммерческое предложение после экспорта.
            {slidesOn
              ? ' Выбранные слайды встраиваются в документ: маркетинговые — после шапки, «Контакты» — в объединённом подвале с подписями.'
              : ''}
            {estimate.includeLegalRequisites !== false
              ? ' В подвале документа отображаются юридические реквизиты.'
              : ''}
          </p>
          <div className="pdf-preview__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={downloading}>
              Закрыть
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? 'Сохранение…' : 'Скачать PDF'}
            </button>
          </div>
        </div>
        <div className="pdf-preview__viewport">
          <div className="pdf-preview__sheet" ref={sheetRef} />
        </div>
      </div>
    </Modal>
  );
}
