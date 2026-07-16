import type { EstimateType } from '../../types';

export type EstimatesTypeFilter = 'all' | EstimateType;

export interface EstimatesFilterState {
  query: string;
  type: EstimatesTypeFilter;
  priceMin: string;
  priceMax: string;
  date: string;
}

interface EstimatesFilterPanelProps {
  filters: EstimatesFilterState;
  advancedOpen: boolean;
  onFiltersChange: (next: EstimatesFilterState) => void;
  onToggleAdvanced: () => void;
  onReset: () => void;
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const TYPE_TABS: Array<{ value: EstimatesTypeFilter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'project', label: 'Проектные' },
  { value: 'standard', label: 'Типовые' },
];

export const DEFAULT_ESTIMATES_FILTERS: EstimatesFilterState = {
  query: '',
  type: 'all',
  priceMin: '',
  priceMax: '',
  date: '',
};

export function EstimatesFilterPanel({
  filters,
  advancedOpen,
  onFiltersChange,
  onToggleAdvanced,
  onReset,
}: EstimatesFilterPanelProps) {
  const patch = (partial: Partial<EstimatesFilterState>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  return (
    <div className="filter-section">
      <div className="filter-main-row">
        <div className="search-input-wrapper">
          <span className="search-icon">
            <SearchIcon />
          </span>
          <input
            type="text"
            id="filter-search-query"
            value={filters.query}
            onChange={(event) => patch({ query: event.target.value })}
            placeholder="Поиск по названию, клиенту или автору..."
            aria-label="Поиск смет"
          />
        </div>

        <div className="type-segmented-control" role="group" aria-label="Тип сметы">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`type-tab${filters.type === tab.value ? ' active' : ''}`}
              data-type={tab.value}
              onClick={() => patch({ type: tab.value })}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`btn-toggle-advanced${advancedOpen ? ' open' : ''}`}
          onClick={onToggleAdvanced}
          aria-expanded={advancedOpen}
          aria-controls="advanced-filters-panel"
        >
          <span>Фильтры</span>
          <svg className="arrow-icon" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
            <path
              d="M1 1L5 5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {advancedOpen && (
        <div id="advanced-filters-panel" className="advanced-filters-panel">
          <div className="advanced-grid">
            <div className="filter-field">
              <label htmlFor="filter-price-min">Сумма сметы, ₽</label>
              <div className="range-inputs">
                <input
                  type="number"
                  id="filter-price-min"
                  value={filters.priceMin}
                  onChange={(event) => patch({ priceMin: event.target.value })}
                  placeholder="от"
                  min={0}
                />
                <span className="range-dash">—</span>
                <input
                  type="number"
                  id="filter-price-max"
                  value={filters.priceMax}
                  onChange={(event) => patch({ priceMax: event.target.value })}
                  placeholder="до"
                  min={0}
                />
              </div>
            </div>

            <div className="filter-field">
              <label htmlFor="filter-date">Дата обновления</label>
              <input
                type="date"
                id="filter-date"
                value={filters.date}
                onChange={(event) => patch({ date: event.target.value })}
              />
            </div>

            <div className="filter-field reset-field">
              <button type="button" className="btn-reset-filters" onClick={onReset}>
                Сбросить всё
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
