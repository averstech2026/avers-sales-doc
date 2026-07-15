import { Link } from 'react-router-dom';
import { formatEstimateAuthorName } from '../../services/auth';
import { formatCurrency, formatDate } from '../../utils/calculator';
import type { EstimateListItem } from '../../types';

function DuplicateEstimateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 16V6a2 2 0 0 1 2-2h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M8 9l4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M7 7l1 12a1 1 0 0 0 1 .929h6a1 1 0 0 0 1-.929L17 7"
        stroke="currentColor"
        strokeWidth="1.6"
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

  return (
    <article className={cardClass}>
      <div className="estimate-card__actions">
        <button
          type="button"
          className="estimate-card__action"
          onClick={() => onDuplicate(estimate.id)}
          disabled={busy}
          title="Создать копию"
          aria-label={`Создать копию сметы «${estimate.projectName}»`}
        >
          <DuplicateEstimateIcon />
        </button>

        {archivedView ? (
          <>
            <button
              type="button"
              className="estimate-card__action estimate-card__action--restore"
              onClick={() => onRestore(estimate.id)}
              disabled={busy}
              title="Восстановить"
              aria-label={`Восстановить смету «${estimate.projectName}»`}
            >
              <RestoreIcon />
            </button>
            <button
              type="button"
              className="estimate-card__action estimate-card__action--danger"
              onClick={() => onDelete(estimate)}
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
            className="estimate-card__action estimate-card__action--archive"
            onClick={() => onArchive(estimate.id)}
            disabled={busy}
            title="В архив"
            aria-label={`Отправить в архив смету «${estimate.projectName}»`}
          >
            <ArchiveIcon />
          </button>
        )}
      </div>

      <Link to={`/estimate?id=${estimate.id}`} className="estimate-card__link">
        <div className="estimate-card__name">{estimate.projectName}</div>
        <div className="estimate-card__client">{estimate.clientName}</div>
        <div className="estimate-card__meta">
          <span>{formatCurrency(estimate.totalWithVat)}</span>
          <span>{formatDate(estimate.updatedAt)}</span>
        </div>
        <div className="estimate-card__author">
          Создал: {formatEstimateAuthorName(estimate.createdByName)}
        </div>
      </Link>
    </article>
  );
}
