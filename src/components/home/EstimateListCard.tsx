import { Link } from 'react-router-dom';
import { formatEstimateAuthorName } from '../../services/auth';
import { formatCurrency, formatDate } from '../../utils/calculator';
import type { EstimateListItem } from '../../types';

function DuplicateEstimateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 8H3V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2zM10 12h4M19 8v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8 9l4-4 4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 7l1 12a1 1 0 0 0 1 .929h6a1 1 0 0 0 1-.929L17 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface EstimateListCardProps {
  estimate: EstimateListItem;
  archivedView: boolean;
  leaving: boolean;
  busy: boolean;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (estimate: EstimateListItem) => void;
}

export function EstimateListCard({
  estimate,
  archivedView,
  leaving,
  busy,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
}: EstimateListCardProps) {
  const cardClass = [
    'estimate-card',
    archivedView ? 'estimate-card--archived-view' : '',
    leaving ? 'estimate-card--leaving' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const clientLabel = estimate.clientName?.trim() || 'Без клиента';
  const authorLabel = formatEstimateAuthorName(estimate.createdByName);
  const estimateHref = `/estimate?id=${estimate.id}`;

  const isStandard = estimate.type === 'standard';

  return (
    <article className={cardClass} data-id={estimate.id}>
      <div className="card-header">
        <div className="card-title-group">
          <span className={`type-badge ${isStandard ? 'badge-standard' : 'badge-project'}`}>
            {isStandard ? 'Типовая' : 'Проектная'}
          </span>
          <h4 className="card-title">
            <Link to={estimateHref}>{estimate.projectName}</Link>
          </h4>
        </div>
        <div className="card-actions">
          <button
            type="button"
            className="action-btn"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDuplicate(estimate.id);
            }}
            disabled={busy}
            title="Копировать"
            aria-label={`Создать копию сметы «${estimate.projectName}»`}
          >
            <DuplicateEstimateIcon />
          </button>

          {archivedView ? (
            <>
              <button
                type="button"
                className="action-btn action-btn--restore"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onRestore(estimate.id);
                }}
                disabled={busy}
                title="Восстановить"
                aria-label={`Восстановить смету «${estimate.projectName}»`}
              >
                <RestoreIcon />
              </button>
              <button
                type="button"
                className="action-btn action-btn--danger"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDelete(estimate);
                }}
                disabled={busy}
                title="Удалить"
                aria-label={`Удалить смету «${estimate.projectName}»`}
              >
                <DeleteIcon />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="action-btn action-btn--archive"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onArchive(estimate.id);
              }}
              disabled={busy}
              title="В архив"
              aria-label={`Отправить в архив смету «${estimate.projectName}»`}
            >
              <ArchiveIcon />
            </button>
          )}
        </div>
      </div>

      <Link to={estimateHref} className="estimate-card__main">
        <div className="card-body">
          <div className="card-client" title={clientLabel}>
            {clientLabel}
          </div>
          <div className="card-author">
            <span className="author-label">Создал:</span> {authorLabel}
          </div>
        </div>

        <div className="card-footer">
          <div className="card-price">{formatCurrency(estimate.totalWithVat)}</div>
          <div className="card-date">{formatDate(estimate.updatedAt)}</div>
        </div>
      </Link>
    </article>
  );
}
