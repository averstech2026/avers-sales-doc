import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EstimateEditor } from '../components/estimate/EstimateEditor';
import { StandardEstimateEditor } from '../components/estimate/StandardEstimateEditor';
import { SummaryCards } from '../components/estimate/SummaryCards';
import { StandardSummaryCards } from '../components/estimate/StandardSummaryCards';
import { RatesSettings } from '../components/estimate/RatesSettings';
import { AiParsePanel } from '../components/ai/AiParsePanel';
import { EditorBackLink } from '../components/ui/EditorBackLink';
import { Modal } from '../components/ui/Modal';
import {
  createNewEstimate,
  createNewStandardEstimate,
  getCancelConfirmMessage,
  isStandardEstimate,
  serializeEstimateForCompare,
  shouldDeleteOnCancel,
} from '../utils/estimateFactory';
import { calculateEstimateTotals } from '../utils/calculator';
import { calculateStandardTotals } from '../utils/standardCalculator';
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
  const estimateTypeParam = searchParams.get('type');

  const [estimate, setEstimate] = useState<Estimate>(() =>
    estimateTypeParam === 'standard' ? createNewStandardEstimate() : createNewEstimate()
  );
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    serializeEstimateForCompare(
      estimateTypeParam === 'standard' ? createNewStandardEstimate() : createNewEstimate()
    )
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
  const isStandard = isStandardEstimate(estimate);
  const totals = useMemo(() => calculateEstimateTotals(estimate), [estimate]);
  const standardTotals = useMemo(
    () => calculateStandardTotals(estimate.standardItems ?? [], estimate.vatRate ?? 0.05),
    [estimate.standardItems, estimate.vatRate]
  );

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
    const initial =
      estimateTypeParam === 'standard' ? createNewStandardEstimate({ isDraft: true }) : createNewEstimate({ isDraft: true });
    setEstimate(initial);
    setSavedSnapshot(serializeEstimateForCompare(initial));
  }, [estimateId, estimateTypeParam]);

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
      const finalized = isStandard
        ? {
            ...estimate,
            isDraft: false,
            oneTimeTotal: standardTotals.oneTimeWithVat,
            recurringTotal: standardTotals.recurringMonthly,
          }
        : { ...estimate, isDraft: false };
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
        <div className="editor-header-left">
          <EditorBackLink
            label="К списку смет"
            onClick={handleCancelClick}
            disabled={cancelling || saving}
          />
          <h1>{estimate.projectName}</h1>
          <p className="page-header__sub">
            {estimate.clientName || 'Укажите заказчика'} ·{' '}
            {isStandard ? 'Типовое внедрение (ПО и Услуги)' : 'Редактор сметы'}
          </p>
        </div>
        <div className="page-header__actions">
          {!isStandard && (
            <>
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
            </>
          )}
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
            className="btn btn-save"
            id="btn-save-cloud"
            onClick={handleSave}
            disabled={saving || cancelling}
          >
            {saving ? 'Сохранение…' : 'Сохранить в облако'}
          </button>
        </div>
      </header>

      {isStandard ? <StandardSummaryCards totals={standardTotals} /> : <SummaryCards totals={totals} />}
      <div className="estimate-page__editor">
        {isStandard ? (
          <StandardEstimateEditor estimate={estimate} onChange={setEstimate} />
        ) : (
          <EstimateEditor estimate={estimate} onChange={setEstimate} />
        )}

        <div className="estimate-page__summary-footer">
          {isStandard ? (
            <div className="summary-wrapper">
              <div className="summary-group one-time-group">
                <div className="summary-row sub">
                  <span className="summary-label">Единоразово без НДС:</span>
                  <span className="summary-value">
                    {standardTotals.oneTimeSubtotal.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <div className="summary-row sub">
                  <span className="summary-label">
                    НДС {Math.round(standardTotals.vatRate * 100)}%:
                  </span>
                  <span className="summary-value">
                    {standardTotals.vat.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <div className="summary-divider" />
                <div className="summary-row main-total">
                  <span className="summary-label-total">ИТОГО К ОПЛАТЕ (ЕДИНОРАЗОВО):</span>
                  <span className="summary-value-total text-red">
                    {standardTotals.oneTimeWithVat.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
              {standardTotals.recurringMonthly > 0 && (
                <div className="summary-group recurring-group">
                  <div className="summary-row main-total-recurring">
                    <span className="summary-label-recurring">ИТОГО АРЕНДА (ЕЖЕМЕСЯЧНО):</span>
                    <span className="summary-value-recurring text-blue">
                      {standardTotals.recurringMonthly.toLocaleString('ru-RU')} ₽ / мес.
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
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
          )}
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
