import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CornerFrame } from '../components/ui/CornerFrame';
import { Modal } from '../components/ui/Modal';
import { EstimateListCard } from '../components/home/EstimateListCard';
import {
  DEFAULT_ESTIMATES_FILTERS,
  EstimatesFilterPanel,
  type EstimatesFilterState,
} from '../components/home/EstimatesFilterPanel';
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

function getCloudStatusBadgeLabel(status: CloudConnectionStatus): string {
  switch (status) {
    case 'connected':
      return 'Облако синхронизировано';
    case 'error':
      return 'Ошибка облака';
    case 'checking':
      return 'Проверка облака…';
    default:
      return 'Локальный режим';
  }
}

function isArchivedEstimate(estimate: EstimateListItem): boolean {
  return estimate.isArchived === true;
}

function hasActiveFilters(filters: EstimatesFilterState): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.type !== 'all' ||
    filters.priceMin !== '' ||
    filters.priceMax !== '' ||
    filters.date !== ''
  );
}

function filterEstimates(
  items: EstimateListItem[],
  filters: EstimatesFilterState
): EstimateListItem[] {
  const query = filters.query.toLowerCase().trim();
  const priceMin = filters.priceMin !== '' ? parseFloat(filters.priceMin) : null;
  const priceMax = filters.priceMax !== '' ? parseFloat(filters.priceMax) : null;
  const filterDate = filters.date || null;

  return items.filter((est) => {
    if (filters.type !== 'all' && est.type !== filters.type) {
      return false;
    }

    if (query) {
      const titleMatch = est.projectName.toLowerCase().includes(query);
      const clientMatch = est.clientName.toLowerCase().includes(query);
      const authorMatch = (est.createdByName ?? '').toLowerCase().includes(query);
      if (!titleMatch && !clientMatch && !authorMatch) {
        return false;
      }
    }

    if (priceMin !== null && !Number.isNaN(priceMin) && est.totalWithVat < priceMin) {
      return false;
    }

    if (priceMax !== null && !Number.isNaN(priceMax) && est.totalWithVat > priceMax) {
      return false;
    }

    if (filterDate) {
      const estDate = est.updatedAt.slice(0, 10);
      if (estDate !== filterDate) return false;
    }

    return true;
  });
}

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, firebaseReady } = useAuth();
  const [estimates, setEstimates] = useState<EstimateListItem[]>([]);
  const [tab, setTab] = useState<EstimatesTab>('active');
  const [filters, setFilters] = useState<EstimatesFilterState>(DEFAULT_ESTIMATES_FILTERS);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
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

  const tabEstimates = tab === 'active' ? activeEstimates : archivedEstimates;

  const visibleEstimates = useMemo(
    () => filterEstimates(tabEstimates, filters),
    [tabEstimates, filters]
  );

  const filtersActive = hasActiveFilters(filters);

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

  const handleResetFilters = () => {
    setFilters(DEFAULT_ESTIMATES_FILTERS);
  };

  return (
    <div className="page home-page">
      <header className="page-header">
        <div>
          <h1>Конструктор смет и КП</h1>
          <p className="page-header__sub">
            Интерактивный расчёт бюджета проектов ООО «Аверс Технолоджи»
          </p>
        </div>
        <button
          type="button"
          className={`cloud-status-badge cloud-status-badge--${cloudStatus}`}
          onClick={() => setCloudModalOpen(true)}
          title="Настройки облачного подключения"
        >
          <span
            className={`status-dot${cloudStatus === 'connected' || cloudStatus === 'checking' ? ' pulsing' : ''}`}
            aria-hidden="true"
          />
          <span className="cloud-icon" aria-hidden="true">
            ☁️
          </span>
          <span className="status-text">{getCloudStatusBadgeLabel(cloudStatus)}</span>
        </button>
      </header>

      <div className="home-page__hero">
        <CornerFrame accent className="hero-card hero-card--primary">
          <h2>Проектная смета (по часам)</h2>
          <p>
            Создайте смету с предзаполненными этапами анализа, добавьте задачи, настройте ставки и
            экспортируйте КП в PDF или Excel.
          </p>
          <Link to="/estimate" className="btn btn-save btn-save--project">
            Создать смету
          </Link>
        </CornerFrame>

        <CornerFrame accent className="hero-card hero-card--standard">
          <h2>Типовое внедрение</h2>
          <p>
            Спецификация готового ПО (лицензии и аренда) и стандартных услуг по фиксированному
            прайсу — без почасового расчёта.
          </p>
          <Link to="/estimate?type=standard" className="btn btn-save btn-save--standard">
            Создать КП (ПО и Услуги)
          </Link>
        </CornerFrame>
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
        {!loading && cloudStatus === 'connected' && estimates.length > 0 && (
          <>
            <EstimatesFilterPanel
              filters={filters}
              advancedOpen={advancedFiltersOpen}
              onFiltersChange={setFilters}
              onToggleAdvanced={() => setAdvancedFiltersOpen((open) => !open)}
              onReset={handleResetFilters}
            />

            {tabEstimates.length === 0 ? (
              <p className="muted">
                {tab === 'active'
                  ? 'Нет активных смет. Переключитесь в архив или создайте новую.'
                  : 'Архив пуст. Отправьте сюда завершённые сметы с главного списка.'}
              </p>
            ) : visibleEstimates.length === 0 ? (
              <p className="muted">
                {filtersActive
                  ? 'Ничего не найдено. Измените параметры поиска или сбросьте фильтры.'
                  : tab === 'active'
                    ? 'Нет активных смет. Переключитесь в архив или создайте новую.'
                    : 'Архив пуст. Отправьте сюда завершённые сметы с главного списка.'}
              </p>
            ) : (
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
          </>
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
