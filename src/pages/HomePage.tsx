import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CornerFrame } from '../components/ui/CornerFrame';
import { Modal } from '../components/ui/Modal';
import { EstimateListCard } from '../components/home/EstimateListCard';
import {
  CloudConnectionSettings,
  type CloudConnectionStatus,
} from '../components/settings/CloudConnectionSettings';
import {
  deleteEstimate,
  duplicateEstimate,
  listEstimates,
  toggleArchiveEstimate,
} from '../services/firestore';
import { resolveEstimateCreatorName } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import type { EstimateListItem } from '../types';

type EstimatesTab = 'active' | 'archive';

const LEAVE_ANIMATION_MS = 280;

function CloudStatusIcon({ status }: { status: CloudConnectionStatus }) {
  if (status === 'connected') {
    return (
      <span className="cloud-status-card__icon cloud-status-card__icon--connected" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 18a4.5 4.5 0 0 1 0-9 5.5 5.5 0 0 1 10.8 1.3A4 4 0 1 1 17 18H7z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="m9 13 2 2 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span className="cloud-status-card__icon cloud-status-card__icon--warning" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 18a4.5 4.5 0 0 1 0-9 5.5 5.5 0 0 1 10.8 1.3A4 4 0 1 1 17 18H7z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M12 9v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
      </span>
    );
  }

  return (
    <span className="cloud-status-card__icon cloud-status-card__icon--local" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 18a4.5 4.5 0 0 1 0-9 5.5 5.5 0 0 1 10.8 1.3A4 4 0 1 1 17 18H7z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function getCloudStatusMessage(status: CloudConnectionStatus): string {
  switch (status) {
    case 'connected':
      return 'База данных Firestore подключена. Все сметы синхронизируются в реальном времени.';
    case 'error':
      return 'Не удалось подключиться к Firestore. Нажмите для проверки настроек.';
    case 'checking':
      return 'Проверка подключения к облаку…';
    default:
      return 'Локальный режим. Нажмите для настройки подключения к облаку.';
  }
}

function isArchivedEstimate(estimate: EstimateListItem): boolean {
  return estimate.isArchived === true;
}

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, firebaseReady } = useAuth();
  const [estimates, setEstimates] = useState<EstimateListItem[]>([]);
  const [tab, setTab] = useState<EstimatesTab>('active');
  const [loading, setLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<CloudConnectionStatus>('checking');
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState('');

  const loadEstimates = useCallback(async () => {
    if (!firebaseReady || !user) {
      setLoading(false);
      return;
    }

    setCloudStatus('checking');
    try {
      const items = await listEstimates();
      setEstimates(items);
      setCloudStatus('connected');
    } catch {
      setEstimates([]);
      setCloudStatus('error');
    } finally {
      setLoading(false);
    }
  }, [firebaseReady, user]);

  useEffect(() => {
    setLoading(true);
    void loadEstimates();
  }, [loadEstimates, location.key]);

  const activeEstimates = useMemo(
    () => estimates.filter((item) => !isArchivedEstimate(item)),
    [estimates]
  );

  const archivedEstimates = useMemo(
    () => estimates.filter((item) => isArchivedEstimate(item)),
    [estimates]
  );

  const visibleEstimates = tab === 'active' ? activeEstimates : archivedEstimates;

  const runWithLeaveAnimation = async (estimateId: string, action: () => Promise<void>) => {
    setActionError('');
    setBusyId(estimateId);
    setLeavingIds((prev) => new Set(prev).add(estimateId));

    await new Promise((resolve) => {
      window.setTimeout(resolve, LEAVE_ANIMATION_MS);
    });

    try {
      await action();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('permission') || message.includes('Permission')) {
        setActionError(
          'Нет прав на изменение сметы. Задеплойте правила Firestore: .\\scripts\\deploy-firestore-rules.ps1'
        );
      } else {
        setActionError('Не удалось выполнить действие. Попробуйте ещё раз.');
      }
    } finally {
      setLeavingIds((prev) => {
        const next = new Set(prev);
        next.delete(estimateId);
        return next;
      });
      setBusyId(null);
    }
  };

  const handleDuplicate = async (estimateId: string) => {
    if (!firebaseReady || !user || busyId) return;
    setActionError('');
    setBusyId(estimateId);
    try {
      const newId = await duplicateEstimate(estimateId, {
        createdByUid: user.uid,
        createdByName: resolveEstimateCreatorName(user),
      });
      navigate(`/estimate?id=${newId}`);
    } catch {
      setActionError('Не удалось создать копию сметы. Попробуйте ещё раз.');
    } finally {
      setBusyId(null);
    }
  };

  const handleArchive = (estimateId: string) => {
    if (!firebaseReady || !user || busyId) return;

    void runWithLeaveAnimation(estimateId, async () => {
      await toggleArchiveEstimate(estimateId, true, {
        createdByUid: user.uid,
        createdByName: resolveEstimateCreatorName(user),
      });
      setEstimates((prev) =>
        prev.map((item) =>
          item.id === estimateId
            ? { ...item, isArchived: true, createdByName: item.createdByName || resolveEstimateCreatorName(user) }
            : item
        )
      );
    });
  };

  const handleRestore = (estimateId: string) => {
    if (!firebaseReady || !user || busyId) return;

    void runWithLeaveAnimation(estimateId, async () => {
      await toggleArchiveEstimate(estimateId, false, {
        createdByUid: user.uid,
        createdByName: resolveEstimateCreatorName(user),
      });
      setEstimates((prev) =>
        prev.map((item) => (item.id === estimateId ? { ...item, isArchived: false } : item))
      );
    });
  };

  const handleDelete = async (estimate: EstimateListItem) => {
    if (!firebaseReady || busyId) return;

    const confirmed = window.confirm(
      `Удалить смету «${estimate.projectName}» безвозвратно?\n\nЭто действие нельзя отменить.`
    );
    if (!confirmed) return;

    setActionError('');
    setBusyId(estimate.id);
    setLeavingIds((prev) => new Set(prev).add(estimate.id));

    await new Promise((resolve) => {
      window.setTimeout(resolve, LEAVE_ANIMATION_MS);
    });

    try {
      await deleteEstimate(estimate.id);
      setEstimates((prev) => prev.filter((item) => item.id !== estimate.id));
    } catch {
      setActionError('Не удалось удалить смету. Попробуйте ещё раз.');
    } finally {
      setLeavingIds((prev) => {
        const next = new Set(prev);
        next.delete(estimate.id);
        return next;
      });
      setBusyId(null);
    }
  };

  return (
    <div className="page home-page">
      <header className="page-header">
        <div>
          <h1>Генератор смет</h1>
          <p className="page-header__sub">
            Интерактивный расчёт бюджета проектов ООО «Аверс Технолоджи»
          </p>
        </div>
      </header>

      <div className="home-page__hero">
        <CornerFrame accent className="hero-card hero-card--primary">
          <h2>Быстрый старт</h2>
          <p>
            Создайте смету с предзаполненными этапами анализа, добавьте задачи, настройте ставки и
            экспортируйте КП в PDF или Excel.
          </p>
          <Link to="/estimate" className="btn btn--primary">
            Создать смету
          </Link>
        </CornerFrame>

        <button
          type="button"
          className={`cloud-status-card cloud-status-card--${cloudStatus}`}
          onClick={() => setCloudModalOpen(true)}
        >
          <CloudStatusIcon status={cloudStatus} />
          <div className="cloud-status-card__body">
            <h2 className="cloud-status-card__title">Облачное хранение</h2>
            <p className="cloud-status-card__message">{getCloudStatusMessage(cloudStatus)}</p>
          </div>
          <span className="cloud-status-card__chevron" aria-hidden="true">
            ›
          </span>
        </button>
      </div>

      <section className="estimates-registry">
        <div className="estimates-registry__head">
          <h2 className="section-title">
            <span className="section-title__line" />
            Последние сметы
          </h2>

          {!loading && cloudStatus === 'connected' && (
            <div className="tabs-segmented-control" role="tablist" aria-label="Фильтр смет">
              <button
                type="button"
                role="tab"
                id="tab-active"
                aria-selected={tab === 'active'}
                className={`tab-btn${tab === 'active' ? ' active' : ''}`}
                onClick={() => setTab('active')}
              >
                Активные <span className="archive-count">{activeEstimates.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                id="tab-archive"
                aria-selected={tab === 'archive'}
                className={`tab-btn${tab === 'archive' ? ' active' : ''}`}
                onClick={() => setTab('archive')}
              >
                Архив <span className="archive-count">{archivedEstimates.length}</span>
              </button>
            </div>
          )}
        </div>

        {loading && <p className="muted">Загрузка…</p>}
        {!loading && cloudStatus === 'error' && (
          <p className="muted">Не удалось загрузить сметы из Firestore.</p>
        )}
        {!loading && cloudStatus === 'connected' && estimates.length === 0 && (
          <p className="muted">Пока нет сохранённых смет. Создайте первую!</p>
        )}
        {!loading && cloudStatus === 'connected' && estimates.length > 0 && visibleEstimates.length === 0 && (
          <p className="muted">
            {tab === 'active'
              ? 'Нет активных смет. Переключитесь в архив или создайте новую.'
              : 'Архив пуст. Отправьте сюда завершённые сметы с главного списка.'}
          </p>
        )}
        {!loading && visibleEstimates.length > 0 && (
          <div className={`estimates-list${tab === 'archive' ? ' estimates-list--archive' : ''}`}>
            {visibleEstimates.map((est) => (
              <EstimateListCard
                key={est.id}
                estimate={est}
                archivedView={tab === 'archive'}
                leaving={leavingIds.has(est.id)}
                busy={busyId === est.id}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
        {actionError && <p className="muted estimates-registry__error">{actionError}</p>}
      </section>

      <Modal
        open={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
        title="Подключение к облаку"
        wide
      >
        <CloudConnectionSettings status={cloudStatus} />
      </Modal>
    </div>
  );
}
