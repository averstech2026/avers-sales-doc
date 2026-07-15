import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EstimateEditor } from '../components/estimate/EstimateEditor';
import { SummaryCards } from '../components/estimate/SummaryCards';
import { RatesSettings } from '../components/estimate/RatesSettings';
import { AiParsePanel } from '../components/ai/AiParsePanel';
import { Modal } from '../components/ui/Modal';
import {
  createNewEstimate,
  getCancelConfirmMessage,
  serializeEstimateForCompare,
  shouldDeleteOnCancel,
} from '../utils/estimateFactory';
import { calculateEstimateTotals } from '../utils/calculator';
import { resolveEstimateClientLogo } from '../utils/clientLogo';
import { deleteEstimate, getShareUrl, loadEstimate, saveEstimate } from '../services/firestore';
import { exportToExcel } from '../services/export/excel';
import { PdfPreviewModal } from '../components/estimate/PdfPreviewModal';
import { resolveEstimateCreatorName } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import type { Estimate } from '../types';

export function EstimatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const estimateId = searchParams.get('id');

  const [estimate, setEstimate] = useState<Estimate>(() => createNewEstimate());
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    serializeEstimateForCompare(createNewEstimate())
  );
  const [loading, setLoading] = useState(!!estimateId);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [toast, setToast] = useState('');
  const [exporting, setExporting] = useState<'excel' | null>(null);

  const { user, firebaseReady } = useAuth();
  const totals = useMemo(() => calculateEstimateTotals(estimate), [estimate]);

  const isDirty = useMemo(
    () => serializeEstimateForCompare(estimate) !== savedSnapshot,
    [estimate, savedSnapshot]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  useEffect(() => {
    if (estimateId) return;
    const initial = createNewEstimate({ isDraft: true });
    setEstimate(initial);
    setSavedSnapshot(serializeEstimateForCompare(initial));
  }, [estimateId]);

  useEffect(() => {
    if (!estimateId) return;

    setLoading(true);
    loadEstimate(estimateId)
      .then((data) => {
        if (!data) {
          showToast('Смета не найдена');
          return;
        }
        setEstimate(data);
        setSavedSnapshot(serializeEstimateForCompare(data));
      })
      .finally(() => setLoading(false));
  }, [estimateId, showToast]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSave = async () => {
    if (!firebaseReady || !user) {
      showToast('Войдите в аккаунт для сохранения');
      return;
    }

    setSaving(true);
    try {
      const finalized = { ...estimate, isDraft: false };
      const id = await saveEstimate(finalized, {
        createdByUid: user.uid,
        createdByName: resolveEstimateCreatorName(user),
      });
      const saved = { ...finalized, id };
      setEstimate(saved);
      setSavedSnapshot(serializeEstimateForCompare(saved));

      const url = getShareUrl(id);
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      showToast('Сохранено! Ссылка скопирована в буфер');
      window.history.replaceState(null, '', `#/estimate?id=${id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (!isDirty && !shouldDeleteOnCancel(estimate)) {
      navigate('/');
      return;
    }
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    setShowCancelModal(false);

    if (shouldDeleteOnCancel(estimate) && estimate.id) {
      setCancelling(true);
      try {
        await deleteEstimate(estimate.id);
        navigate('/', { replace: true });
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Не удалось удалить черновик');
      } finally {
        setCancelling(false);
      }
      return;
    }

    navigate('/', { replace: true });
  };

  const handleCopyLink = () => {
    if (estimate.id) {
      const url = getShareUrl(estimate.id);
      navigator.clipboard.writeText(url);
      setShareUrl(url);
      showToast('Ссылка скопирована');
    }
  };

  const handleExportPdf = () => {
    if (!user) {
      showToast('Войдите в аккаунт для экспорта');
      return;
    }
    setShowPdfPreview(true);
  };

  const pdfExportOptions = useMemo(
    () => ({
      clientLogoSrc: resolveEstimateClientLogo(estimate),
      signature: user
        ? {
            fullName: user.fullName,
            position: user.position,
          }
        : undefined,
    }),
    [estimate, user]
  );

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      await exportToExcel(estimate);
    } catch {
      showToast('Ошибка экспорта Excel');
    } finally {
      setExporting(null);
    }
  };

  const handleAiApply = useCallback(
    (sections: Estimate['sections']) => {
      setEstimate((prev) => ({
        ...prev,
        sections: [...prev.sections, ...sections],
        updatedAt: new Date().toISOString(),
      }));
      setShowAi(false);
      showToast(`Добавлено ${sections.length} раздел(ов) из ТЗ`);
    },
    [showToast]
  );

  if (loading) {
    return <div className="page page--loading">Загрузка сметы…</div>;
  }

  const cancelConfirmLabel = shouldDeleteOnCancel(estimate)
    ? 'Удалить черновик'
    : 'Выйти';

  return (
    <div className="page estimate-page">
      <header className="page-header page-header--sticky">
        <div>
          <h1>{estimate.projectName}</h1>
          <p className="page-header__sub">
            {estimate.clientName || 'Укажите заказчика'} · Редактор сметы
          </p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setShowRates(true)}>
            Ставки
          </button>
          <button
            type="button"
            className="btn btn-ai-analyze"
            id="btn-ai-analyze"
            onClick={() => setShowAi(true)}
          >
            <span className="ai-sparkle-icon" aria-hidden="true">
              ✨
            </span>
            AI-разбор ТЗ
          </button>
          {estimate.id && (
            <button type="button" className="btn btn--ghost" onClick={handleCopyLink}>
              Копировать ссылку
            </button>
          )}
          <button
            type="button"
            className="btn btn--outline"
            onClick={handleExportExcel}
            disabled={!!exporting}
          >
            {exporting === 'excel' ? '…' : 'Excel'}
          </button>
          <button
            type="button"
            className="btn btn--outline"
            onClick={handleExportPdf}
            disabled={!!exporting}
          >
            PDF
          </button>
          <button
            type="button"
            className="btn-cancel-estimate"
            id="btn-cancel-estimate"
            onClick={handleCancelClick}
            disabled={cancelling || saving}
          >
            {cancelling ? 'Удаление…' : 'Отменить и выйти'}
          </button>
          <button
            type="button"
            className="btn btn-save"
            id="btn-save-cloud"
            onClick={handleSave}
            disabled={saving || cancelling}
          >
            {saving ? 'Сохранение…' : 'Сохранить в облако'}
          </button>
        </div>
      </header>

      <SummaryCards totals={totals} />
      <div className="estimate-page__editor">
        <EstimateEditor estimate={estimate} onChange={setEstimate} />

        <div className="estimate-page__summary-footer">
          <div className="estimate-page__grand-total">
            <div className="summary-header">Итого по проекту</div>
            <div className="grand-total-row">
              <span>Итого без НДС</span>
              <strong>{totals.subtotal.toLocaleString('ru-RU')} ₽</strong>
            </div>
            <div className="grand-total-row">
              <span>НДС 5%</span>
              <strong>{totals.vat.toLocaleString('ru-RU')} ₽</strong>
            </div>
            <div className="grand-total-row grand-total-row--final">
              <span>Итого с учётом НДС 5%</span>
              <strong>{totals.totalWithVat.toLocaleString('ru-RU')} ₽</strong>
            </div>
          </div>
        </div>
      </div>

      {shareUrl && (
        <div className="share-url">
          <span>Ссылка:</span>
          <code>{shareUrl}</code>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      <Modal open={showRates} onClose={() => setShowRates(false)} title="Настройки ставок">
        <RatesSettings
          rates={estimate.rates}
          onChange={(rates) =>
            setEstimate((prev) => ({ ...prev, rates, updatedAt: new Date().toISOString() }))
          }
        />
      </Modal>

      <Modal open={showAi} onClose={() => setShowAi(false)} title="Умный разбор ТЗ" wide>
        <AiParsePanel onApply={handleAiApply} />
      </Modal>

      <Modal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Отменить редактирование"
      >
        <p className="modal-confirm__text">{getCancelConfirmMessage(estimate, isDirty)}</p>
        <div className="modal-confirm__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setShowCancelModal(false)}>
            Остаться
          </button>
          <button
            type="button"
            className="btn-cancel-estimate"
            onClick={handleCancelConfirm}
            disabled={cancelling}
          >
            {cancelling ? 'Удаление…' : cancelConfirmLabel}
          </button>
        </div>
      </Modal>

      <PdfPreviewModal
        open={showPdfPreview}
        estimate={estimate}
        options={pdfExportOptions}
        onClose={() => setShowPdfPreview(false)}
        onExported={() => showToast('PDF сохранён')}
        onError={() => showToast('Ошибка экспорта PDF')}
      />
    </div>
  );
}
