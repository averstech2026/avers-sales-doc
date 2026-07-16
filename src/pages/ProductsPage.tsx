import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CornerFrame } from '../components/ui/CornerFrame';
import { Modal } from '../components/ui/Modal';
import { ProductForm } from '../components/products/ProductForm';
import {
  deleteCatalogProduct,
  listCatalogProducts,
  loadProductsDirectory,
} from '../services/firestore';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/calculator';
import type { CatalogProduct, CatalogProductType } from '../types';

type ProductsTab = 'all' | CatalogProductType;

function formatPrice(value: number | undefined): string {
  return formatCurrency(Number(value) || 0);
}

function typeBadgeLabel(type: CatalogProductType): string {
  if (type === 'software') return 'ПО';
  if (type === 'hardware') return 'Оборудование';
  return 'Услуга';
}

export function ProductsPage() {
  const { user, firebaseReady, isSuperadmin } = useAuth();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ProductsTab>('all');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);

  const load = useCallback(async () => {
    if (!firebaseReady || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loadProductsDirectory();
      const items = await listCatalogProducts();
      setProducts(items);
    } catch (err) {
      setProducts([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Не удалось загрузить справочник. Проверьте правила Firestore.'
      );
    } finally {
      setLoading(false);
    }
  }, [firebaseReady, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const software = useMemo(
    () =>
      products
        .filter((p) => p.type === 'software')
        .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [products]
  );

  const hardware = useMemo(
    () =>
      products
        .filter((p) => p.type === 'hardware')
        .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [products]
  );

  const services = useMemo(
    () =>
      products
        .filter((p) => p.type === 'service')
        .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [products]
  );

  const visible = useMemo(() => {
    if (tab === 'software') return software;
    if (tab === 'hardware') return hardware;
    if (tab === 'service') return services;
    return [...software, ...hardware, ...services];
  }, [tab, software, hardware, services]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (product: CatalogProduct) => {
    setEditing(product);
    setEditorOpen(true);
  };

  const handleSaved = async () => {
    setEditorOpen(false);
    setEditing(null);
    await load();
  };

  const handleDelete = async (product: CatalogProduct) => {
    if (!isSuperadmin) return;
    if (!window.confirm(`Удалить «${product.name}» из справочника?`)) return;
    setBusyId(product.id);
    setError('');
    try {
      await deleteCatalogProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить позицию');
    } finally {
      setBusyId(null);
    }
  };

  const createType: CatalogProductType =
    editing?.type ?? (tab === 'all' ? 'software' : tab);

  const emptyMessage =
    tab === 'software'
      ? 'Пока нет программного обеспечения. Добавьте первую позицию.'
      : tab === 'hardware'
        ? 'Пока нет оборудования. Добавьте первую позицию.'
        : tab === 'service'
          ? 'Пока нет услуг. Добавьте первую позицию.'
          : 'Пока нет позиций. Добавьте первую.';

  return (
    <div className="page products-page">
      <header className="page-header">
        <div>
          <h1>Справочник продуктов и услуг</h1>
          <p className="page-header__sub">
            Управление каталогом программного обеспечения, оборудования и стандартных услуг
          </p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn-save" onClick={openCreate}>
            + Добавить позицию
          </button>
        </div>
      </header>

      <CornerFrame className="products-registry">
        <div className="products-registry__toolbar">
          <div className="tabs-segmented-control" role="tablist" aria-label="Тип позиций">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'all'}
              className={`tab-btn${tab === 'all' ? ' active' : ''}`}
              onClick={() => setTab('all')}
            >
              Все
              <span className="archive-count">{products.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'software'}
              className={`tab-btn${tab === 'software' ? ' active' : ''}`}
              onClick={() => setTab('software')}
            >
              💿 Программное обеспечение
              <span className="archive-count">{software.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              data-type="hardware"
              aria-selected={tab === 'hardware'}
              className={`tab-btn${tab === 'hardware' ? ' active' : ''}`}
              onClick={() => setTab('hardware')}
            >
              🔌 Оборудование
              <span className="archive-count">{hardware.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'service'}
              className={`tab-btn${tab === 'service' ? ' active' : ''}`}
              onClick={() => setTab('service')}
            >
              🔧 Услуги и работы
              <span className="archive-count">{services.length}</span>
            </button>
          </div>
        </div>

        {error && <p className="products-registry__error">{error}</p>}

        {loading ? (
          <p className="muted">Загрузка…</p>
        ) : visible.length === 0 ? (
          <div className="products-empty">
            <p className="muted">{emptyMessage}</p>
            <button type="button" className="btn btn--ghost" onClick={openCreate}>
              Добавить позицию
            </button>
          </div>
        ) : (
          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th className="products-table__index">№</th>
                  <th>Тип</th>
                  <th>Наименование</th>
                  <th>Описание</th>
                  <th className="products-table__num">Выкуп / стоимость</th>
                  <th className="products-table__num">Аренда (в месяц)</th>
                  <th>Ед. изм.</th>
                  <th aria-label="Действия" />
                </tr>
              </thead>
              <tbody>
                {visible.map((item, index) => (
                  <tr key={item.id}>
                    <td className="products-table__index">{index + 1}</td>
                    <td>
                      <span
                        className={`products-type-badge products-type-badge--${item.type}`}
                      >
                        {typeBadgeLabel(item.type)}
                      </span>
                    </td>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td className="products-table__desc">{item.description || '—'}</td>
                    <td className="products-table__num">
                      {item.type === 'software'
                        ? formatPrice(item.oneTimePrice)
                        : formatPrice(item.price)}
                    </td>
                    <td className="products-table__num">
                      {item.type === 'software' ? formatPrice(item.subscriptionPrice) : '—'}
                    </td>
                    <td>{item.unit}</td>
                    <td className="actions-col products-table__actions">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="action-item-btn edit-btn"
                          title="Редактировать"
                          aria-label="Редактировать"
                          onClick={() => openEdit(item)}
                          disabled={busyId === item.id}
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>
                        {isSuperadmin && (
                          <button
                            type="button"
                            className="action-item-btn delete-btn"
                            title="Удалить"
                            aria-label="Удалить"
                            onClick={() => void handleDelete(item)}
                            disabled={busyId === item.id}
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="helper-banner">
          <p className="helper-text">
            Позиции из справочника подставляются в КП «Типовое внедрение» при добавлении программы,
            оборудования или услуги.
          </p>
          <Link to="/estimate?type=standard" className="btn btn--ghost btn-create-estimate">
            Создать КП (ПО и Услуги)
          </Link>
        </div>
      </CornerFrame>

      <Modal
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Редактирование позиции' : 'Добавить позицию'}
      >
        <ProductForm
          product={editing}
          defaultType={createType}
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
