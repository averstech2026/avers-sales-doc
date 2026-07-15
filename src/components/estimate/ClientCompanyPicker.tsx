import { useEffect, useMemo, useRef, useState } from 'react';
import type { Company, Estimate } from '../../types';
import { listCompanies } from '../../services/firestore';
import { useAuth } from '../../context/AuthContext';

interface ClientCompanyPickerProps {
  estimate: Estimate;
  onChange: (patch: Partial<Estimate>) => void;
}

function applyCompanyToEstimate(company: Company): Partial<Estimate> {
  const hasLogo = Boolean(company.logoDataUrl);
  return {
    clientId: company.id,
    clientName: company.name,
    clientLogoId: hasLogo ? 'custom' : 'none',
    clientLogoCustom: hasLogo ? company.logoDataUrl : null,
  };
}

function matchesQuery(company: Company, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    company.name.toLowerCase().includes(q) ||
    company.inn.toLowerCase().includes(q)
  );
}

export function ClientCompanyPicker({ estimate, onChange }: ClientCompanyPickerProps) {
  const { user, firebaseReady } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!firebaseReady || !user) return;
    let cancelled = false;
    setLoading(true);
    void listCompanies()
      .then((items) => {
        if (!cancelled) setCompanies(items);
      })
      .catch(() => {
        if (!cancelled) setCompanies([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [firebaseReady, user]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      searchInputRef.current?.focus();
    }
  }, [open]);

  const selected = useMemo(
    () => companies.find((c) => c.id === estimate.clientId) ?? null,
    [companies, estimate.clientId]
  );

  const filteredCompanies = useMemo(
    () => companies.filter((company) => matchesQuery(company, search)),
    [companies, search]
  );

  const disabled = loading || companies.length === 0;

  const triggerLabel = loading
    ? 'Загрузка…'
    : companies.length === 0
      ? 'Справочник пуст — введите вручную'
      : selected
        ? selected.name
        : 'Выбрать компанию...';

  const handleToggle = () => {
    if (disabled) return;
    setOpen((prev) => {
      if (prev) setSearch('');
      return !prev;
    });
  };

  const handleSelectCompany = (company: Company) => {
    onChange(applyCompanyToEstimate(company));
    setOpen(false);
    setSearch('');
  };

  const handleClearSelection = () => {
    onChange({
      clientId: undefined,
      clientName: estimate.clientName,
    });
    setOpen(false);
    setSearch('');
  };

  const handleNameChange = (value: string) => {
    const stillMatches = selected && selected.name === value;
    onChange({
      clientName: value,
      clientId: stillMatches ? selected.id : undefined,
    });
  };

  return (
    <div className="client-company-picker">
      <label className="field">
        <span>Заказчик из справочника</span>
        <div
          className={`custom-select-container${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}`}
          id="custom-company-select"
          ref={rootRef}
        >
          <button
            type="button"
            className="custom-select-trigger"
            onClick={handleToggle}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span
              className={`custom-select-value${!selected && !loading ? ' is-placeholder' : ''}`}
            >
              {triggerLabel}
            </span>
            <div className="custom-select-arrow" aria-hidden="true">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1 1.5L6 6.5L11 1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>

          {open && (
            <div className="custom-select-dropdown">
              <div className="custom-select-search-wrapper">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="custom-select-search-input"
                  placeholder="Поиск компании или ИНН..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <ul className="custom-select-options" role="listbox">
                {selected && (
                  <li>
                    <button
                      type="button"
                      className="custom-select-option custom-select-option--clear"
                      onClick={handleClearSelection}
                    >
                      <span className="option-name">— Сбросить выбор —</span>
                    </button>
                  </li>
                )}
                {filteredCompanies.length === 0 ? (
                  <li className="custom-select-option custom-select-option--empty">
                    <span className="option-name">Ничего не найдено</span>
                  </li>
                ) : (
                  filteredCompanies.map((company) => (
                    <li key={company.id}>
                      <button
                        type="button"
                        className={`custom-select-option${
                          company.id === estimate.clientId ? ' is-selected' : ''
                        }`}
                        role="option"
                        aria-selected={company.id === estimate.clientId}
                        onClick={() => handleSelectCompany(company)}
                      >
                        <span className="option-name">{company.name}</span>
                        {company.inn && (
                          <span className="option-details">ИНН {company.inn}</span>
                        )}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </label>

      <label className="field">
        <span>Название заказчика</span>
        <input
          id="client-name-input"
          type="text"
          value={estimate.clientName}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder='ООО «Заказчик»'
        />
        <span className="client-company-picker__field-hint">
          Можно отредактировать вручную после выбора из справочника
        </span>
      </label>

      {selected && (
        <div className="client-company-picker__requisites">
          <div className="client-company-picker__requisites-title">Реквизиты из справочника</div>
          <dl className="client-company-picker__requisites-grid">
            {selected.inn && (
              <>
                <dt>ИНН</dt>
                <dd>{selected.inn}</dd>
              </>
            )}
            {selected.kpp && (
              <>
                <dt>КПП</dt>
                <dd>{selected.kpp}</dd>
              </>
            )}
            {selected.ogrn && (
              <>
                <dt>ОГРН</dt>
                <dd>{selected.ogrn}</dd>
              </>
            )}
            {selected.legalAddress && (
              <>
                <dt>Адрес</dt>
                <dd>{selected.legalAddress}</dd>
              </>
            )}
            {selected.bankName && (
              <>
                <dt>Банк</dt>
                <dd>
                  {selected.bankName}
                  {selected.bik ? `, БИК ${selected.bik}` : ''}
                  {selected.bankAccount ? `, р/с ${selected.bankAccount}` : ''}
                </dd>
              </>
            )}
            {selected.director && (
              <>
                <dt>Руководитель</dt>
                <dd>
                  {selected.director}
                  {selected.directorBasis ? ` (на основании ${selected.directorBasis})` : ''}
                </dd>
              </>
            )}
          </dl>
          {selected.logoDataUrl && (
            <div className="client-company-picker__logo">
              <img src={selected.logoDataUrl} alt={`Логотип ${selected.name}`} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
