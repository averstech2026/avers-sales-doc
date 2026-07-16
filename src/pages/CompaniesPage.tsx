import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CornerFrame } from '../components/ui/CornerFrame';
import { Modal } from '../components/ui/Modal';
import { CompanyForm } from '../components/companies/CompanyForm';
import { deleteCompany, listCompanies } from '../services/firestore';
import { useAuth } from '../context/AuthContext';
import type { Company } from '../types';

function formatRequisitesPreview(company: Company): string {
  const parts = [
    company.inn ? `ИНН ${company.inn}` : '',
    company.kpp ? `КПП ${company.kpp}` : '',
    company.director ? company.director : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

export function CompaniesPage() {
  const { user, firebaseReady } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);

  const load = useCallback(async () => {
    if (!firebaseReady || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const items = await listCompanies();
      setCompanies(items);
    } catch (err) {
      setCompanies([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Не удалось загрузить компании. Проверьте правила Firestore.'
      );
    } finally {
      setLoading(false);
    }
  }, [firebaseReady, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => {
      const haystack = [c.name, c.inn, c.kpp, c.ogrn, c.director, c.legalAddress]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [companies, query]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (company: Company) => {
    setEditing(company);
    setEditorOpen(true);
  };

  const handleSaved = async () => {
    setEditorOpen(false);
    setEditing(null);
    await load();
  };

  const handleDelete = async (company: Company) => {
    if (!window.confirm(`Удалить компанию «${company.name}»?`)) return;
    setBusyId(company.id);
    setError('');
    try {
      await deleteCompany(company.id);
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить компанию');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page companies-page">
      <header className="page-header">
        <div>
          <h1>Мои контрагенты</h1>
          <p className="page-header__sub">
            Справочник заказчиков: реквизиты и логотип подставляются в смету при выборе.
          </p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn-save" onClick={openCreate}>
            + Добавить компанию
          </button>
        </div>
      </header>

      <CornerFrame className="companies-registry">
        <div className="companies-registry__toolbar">
          <label className="field companies-registry__search">
            <span>Поиск</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="По названию, ИНН, руководителю…"
            />
          </label>
          <span className="muted">{filtered.length} из {companies.length}</span>
        </div>

        {error && <p className="companies-registry__error">{error}</p>}

        {loading ? (
          <p className="muted">Загрузка…</p>
        ) : filtered.length === 0 ? (
          <div className="companies-empty">
            <p className="muted">
              {companies.length === 0
                ? 'Пока нет ни одной компании. Добавьте первого заказчика.'
                : 'Ничего не найдено по запросу.'}
            </p>
            {companies.length === 0 && (
              <button type="button" className="btn btn--ghost" onClick={openCreate}>
                Создать компанию
              </button>
            )}
          </div>
        ) : (
          <ul className="companies-list">
            {filtered.map((company) => (
              <li key={company.id} className="company-card">
                <button
                  type="button"
                  className="company-card__main"
                  onClick={() => openEdit(company)}
                >
                  <div className="company-card__logo">
                    {company.logoDataUrl ? (
                      <img src={company.logoDataUrl} alt="" />
                    ) : (
                      <span aria-hidden="true">🏢</span>
                    )}
                  </div>
                  <div className="company-card__body">
                    <div className="company-card__name">{company.name}</div>
                    <div className="company-card__meta">
                      {formatRequisitesPreview(company) || 'Реквизиты не заполнены'}
                    </div>
                    {company.legalAddress && (
                      <div className="company-card__address">{company.legalAddress}</div>
                    )}
                  </div>
                </button>
                <div className="company-card__actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => openEdit(company)}
                    disabled={busyId === company.id}
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost company-card__delete"
                    onClick={() => void handleDelete(company)}
                    disabled={busyId === company.id}
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="helper-banner">
          <p className="helper-text">
            В смете выберите заказчика из списка — подставятся название, логотип и реквизиты.
          </p>
          <Link to="/" className="btn btn--ghost btn-create-estimate">
            Создать смету
          </Link>
        </div>
      </CornerFrame>

      <Modal
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Редактирование компании' : 'Новая компания'}
        wide
      >
        <CompanyForm
          company={editing}
          onSaved={() => void handleSaved()}
          onCancel={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
        />
      </Modal>
    </div>
  );
}
