import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DEFAULT_PRODUCTS_DIRECTORY,
  type HardwareProduct,
  type ProductsDirectory,
  type ServiceProduct,
  type SoftwareProduct,
} from '../../data/products-directory';
import { loadProductsDirectory } from '../../services/firestore';
import type { Estimate, StandardLineItem, StandardPaymentScheme } from '../../types';
import { formatCurrency } from '../../utils/calculator';
import {
  addCatalogItem,
  calculateLineTotal,
  formatStandardLineCost,
  resolvePriceOnSchemeChange,
} from '../../utils/standardCalculator';
import { ClientCompanyPicker } from './ClientCompanyPicker';
import { EstimateLogoSettings } from './EstimateLogoSettings';
import { PresentationSlidesSelector } from './PresentationSlidesSelector';
import { LegalRequisitesToggle } from './LegalRequisitesToggle';
import { ProductPickerMenu } from './ProductPickerMenu';

interface StandardEstimateEditorProps {
  estimate: Estimate;
  onChange: (estimate: Estimate) => void;
}

type PickerKind = 'software' | 'hardware' | 'service' | null;

function DeleteRowButton({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      className="standard-spec__delete-btn"
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

function PaymentSchemeBadge({ item }: { item: StandardLineItem }) {
  if (item.paymentScheme === 'rent') {
    return <span className="standard-badge standard-badge--rent">Аренда (в месяц)</span>;
  }
  if (item.paymentScheme === 'buyout') {
    return <span className="standard-badge standard-badge--buyout">Выкуп (бессрочно)</span>;
  }
  return <span className="standard-badge standard-badge--fixed">Фикс. оплата</span>;
}

function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="standard-qty">
      <button
        type="button"
        className="standard-qty__btn"
        onClick={() => onChange(Math.max(1, value - 1))}
        aria-label="Уменьшить"
      >
        −
      </button>
      <input
        type="number"
        className="standard-spec__input standard-spec__input--qty"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
      />
      <button
        type="button"
        className="standard-qty__btn"
        onClick={() => onChange(value + 1)}
        aria-label="Увеличить"
      >
        +
      </button>
    </div>
  );
}

interface SpecRowProps {
  item: StandardLineItem;
  index: number;
  removing: boolean;
  onSchemeChange: (item: StandardLineItem, scheme: StandardPaymentScheme) => void;
  onUpdate: (itemId: string, patch: Partial<StandardLineItem>) => void;
  onRemove: (itemId: string) => void;
}

function SpecRow({ item, index, removing, onSchemeChange, onUpdate, onRemove }: SpecRowProps) {
  const noteText = item.note ?? '';
  const hasNote = Boolean(noteText.trim());
  const [editingNote, setEditingNote] = useState(false);
  const [draftNote, setDraftNote] = useState(noteText);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editingNote) {
      setDraftNote(noteText);
    }
  }, [noteText, editingNote]);

  const openNoteEditor = () => {
    setDraftNote(noteText);
    setEditingNote(true);
    window.setTimeout(() => {
      const el = noteRef.current;
      if (!el) return;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }, 0);
  };

  const saveAndCloseNote = (value: string) => {
    const trimmed = value.trim();
    onUpdate(item.id, { note: trimmed });
    setDraftNote(trimmed);
    setEditingNote(false);
  };

  const handleNoteKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.blur();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setDraftNote(noteText);
      setEditingNote(false);
    }
  };

  return (
    <div
      className={`standard-spec__row${removing ? ' standard-spec__row--removing' : ''}`}
      role="row"
    >
      <div className="standard-spec__num" role="cell">
        {index + 1}
      </div>

      <div className="standard-spec__name" role="cell">
        <div className="estimate-item-main">
          <input
            type="text"
            className="item-editable-name"
            value={item.name}
            placeholder="Наименование позиции"
            aria-label="Наименование позиции"
            onChange={(e) => onUpdate(item.id, { name: e.target.value })}
          />
          <button
            type="button"
            className={`btn-toggle-note${hasNote ? ' has-note' : ''}`}
            title="Добавить/изменить примечание"
            aria-label="Примечание к позиции"
            aria-expanded={editingNote}
            onClick={openNoteEditor}
          >
            💬
          </button>
        </div>

        <div className="item-note-block">
          {!editingNote && hasNote && (
            <button type="button" className="note-view-mode" onClick={openNoteEditor}>
              <span className="note-bullet" aria-hidden="true">
                i
              </span>
              <span className="note-text-content">{noteText.trim()}</span>
            </button>
          )}

          {editingNote && (
            <div className="note-edit-mode">
              <textarea
                ref={noteRef}
                className="item-editable-note"
                placeholder="Введите примечание к позиции…"
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                onBlur={(e) => saveAndCloseNote(e.target.value)}
                onKeyDown={handleNoteKeyDown}
                rows={2}
              />
              <div className="note-edit-hint">
                Enter — сохранить · Esc — отмена · Shift+Enter — новая строка
              </div>
            </div>
          )}
        </div>

        {item.description && <div className="item-static-desc">{item.description}</div>}
      </div>

      <div className="standard-spec__scheme" role="cell">
        {item.kind === 'software' ? (
          <select
            className="standard-scheme-select"
            value={item.paymentScheme}
            onChange={(e) => onSchemeChange(item, e.target.value as StandardPaymentScheme)}
          >
            <option value="buyout">Выкуп (бессрочно)</option>
            <option value="rent">Аренда (в месяц)</option>
          </select>
        ) : (
          <PaymentSchemeBadge item={item} />
        )}
      </div>

      <div className="standard-spec__col--num" role="cell">
        <input
          type="number"
          className="standard-spec__input standard-spec__input--price"
          min={0}
          value={item.unitPrice}
          onChange={(e) =>
            onUpdate(item.id, { unitPrice: Math.max(0, Number(e.target.value) || 0) })
          }
        />
        <span className="standard-spec__unit-suffix">₽</span>
      </div>

      <div className="standard-spec__col--num standard-spec__col--qty" role="cell">
        <QuantityStepper
          value={item.quantity}
          onChange={(quantity) => onUpdate(item.id, { quantity })}
        />
      </div>

      <div
        className="standard-spec__col--num standard-spec__cost"
        role="cell"
        title={`${calculateLineTotal(item).toLocaleString('ru-RU')} ₽`}
      >
        {formatStandardLineCost(item)}
      </div>

      <div className="standard-spec__actions" role="cell">
        <DeleteRowButton onClick={() => onRemove(item.id)} title="Удалить строку" />
      </div>
    </div>
  );
}

function SpecTableHeader() {
  return (
    <div className="standard-spec__head" role="row">
      <div role="columnheader">№</div>
      <div role="columnheader">Наименование</div>
      <div role="columnheader">Тип оплаты</div>
      <div role="columnheader" className="standard-spec__col--num">
        Цена за ед.
      </div>
      <div role="columnheader" className="standard-spec__col--num standard-spec__col--qty">
        Кол-во
      </div>
      <div role="columnheader" className="standard-spec__col--num">
        Стоимость
      </div>
      <div role="columnheader" aria-label="Управление" />
    </div>
  );
}

function SpecSubtotalRow({
  label,
  oneTime,
  recurring = 0,
}: {
  label: string;
  oneTime: number;
  recurring?: number;
}) {
  let labels: ReactNode;
  let values: ReactNode;

  if (oneTime > 0 && recurring > 0) {
    labels = (
      <>
        <div className="subtotal-row-item">Итого к оплате (разово):</div>
        <div className="subtotal-row-item recurring-label">Итого аренда (ежемесячно):</div>
      </>
    );
    values = (
      <>
        <div className="subtotal-row-item font-bold">{formatCurrency(oneTime)}</div>
        <div className="subtotal-row-item recurring-value">
          {formatCurrency(recurring)} / мес.
        </div>
      </>
    );
  } else if (recurring > 0) {
    labels = (
      <div className="subtotal-row-item recurring-label">Итого аренда (ежемесячно):</div>
    );
    values = (
      <div className="subtotal-row-item recurring-value">
        {formatCurrency(recurring)} / мес.
      </div>
    );
  } else {
    labels = <div className="subtotal-row-item">{label}</div>;
    values = (
      <div className="subtotal-row-item font-bold">{formatCurrency(oneTime)}</div>
    );
  }

  return (
    <div className="table-subtotal-row" role="row">
      <div className="subtotal-label" role="cell">
        <div className="subtotal-split-wrapper subtotal-split-wrapper--labels">{labels}</div>
      </div>
      <div className="subtotal-value-container" role="cell">
        <div className="subtotal-split-wrapper">{values}</div>
      </div>
      <div className="subtotal-actions" role="cell" aria-hidden="true" />
    </div>
  );
}

export function StandardEstimateEditor({ estimate, onChange }: StandardEstimateEditorProps) {
  const items = estimate.standardItems ?? [];
  const [picker, setPicker] = useState<PickerKind>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<ProductsDirectory>(DEFAULT_PRODUCTS_DIRECTORY);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const softwareWrapperRef = useRef<HTMLDivElement>(null);
  const hardwareWrapperRef = useRef<HTMLDivElement>(null);
  const serviceWrapperRef = useRef<HTMLDivElement>(null);

  const softwareItems = useMemo(() => items.filter((i) => i.kind === 'software'), [items]);
  const hardwareItems = useMemo(() => items.filter((i) => i.kind === 'hardware'), [items]);
  const serviceItems = useMemo(() => items.filter((i) => i.kind === 'service'), [items]);

  const softwareSubtotal = useMemo(() => {
    let oneTime = 0;
    let rent = 0;
    for (const item of softwareItems) {
      const total = calculateLineTotal(item);
      if (item.paymentScheme === 'rent') rent += total;
      else oneTime += total;
    }
    return { oneTime, rent };
  }, [softwareItems]);

  const hardwareSubtotal = useMemo(
    () => hardwareItems.reduce((sum, item) => sum + calculateLineTotal(item), 0),
    [hardwareItems]
  );

  const servicesSubtotal = useMemo(
    () => serviceItems.reduce((sum, item) => sum + calculateLineTotal(item), 0),
    [serviceItems]
  );

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    loadProductsDirectory()
      .then((directory) => {
        if (!cancelled) setCatalog(directory);
      })
      .catch(() => {
        if (!cancelled) setCatalog(DEFAULT_PRODUCTS_DIRECTORY);
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(
    (patch: Partial<Estimate>) =>
      onChange({ ...estimate, ...patch, updatedAt: new Date().toISOString() }),
    [estimate, onChange]
  );

  const updateItems = useCallback(
    (nextItems: StandardLineItem[]) => update({ standardItems: nextItems }),
    [update]
  );

  const updateItem = useCallback(
    (itemId: string, patch: Partial<StandardLineItem>) => {
      updateItems(items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
    },
    [items, updateItems]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      setRemovingId(itemId);
      window.setTimeout(() => {
        updateItems(items.filter((item) => item.id !== itemId));
        setRemovingId(null);
      }, 220);
    },
    [items, updateItems]
  );

  const handleAddSoftware = useCallback(
    (product: SoftwareProduct) => {
      updateItems(addCatalogItem(items, product, 'software'));
    },
    [items, updateItems]
  );

  const handleAddHardware = useCallback(
    (product: HardwareProduct) => {
      updateItems(addCatalogItem(items, product, 'hardware'));
    },
    [items, updateItems]
  );

  const handleAddService = useCallback(
    (product: ServiceProduct) => {
      updateItems(addCatalogItem(items, product, 'service'));
    },
    [items, updateItems]
  );

  const handleSchemeChange = (item: StandardLineItem, scheme: StandardPaymentScheme) => {
    if (item.kind !== 'software') return;
    const unitPrice = resolvePriceOnSchemeChange(item, scheme);
    updateItem(item.id, { paymentScheme: scheme, unitPrice });
  };

  const closePicker = useCallback(() => setPicker(null), []);

  return (
    <div className="standard-editor">
      <div className="estimate-editor__meta standard-editor__meta">
        <label className="field field--wide">
          <span>Название проекта</span>
          <input
            type="text"
            value={estimate.projectName}
            onChange={(e) => update({ projectName: e.target.value })}
          />
        </label>

        <div className="field--wide">
          <ClientCompanyPicker estimate={estimate} onChange={update} />
        </div>

        <div className="field field--wide personalization-section">
          <EstimateLogoSettings estimate={estimate} onChange={update} />
        </div>

        <div className="field field--wide">
          <PresentationSlidesSelector estimate={estimate} onChange={update} />
        </div>

        <div className="field field--wide">
          <LegalRequisitesToggle estimate={estimate} onChange={update} />
        </div>

        <label className="field field--wide">
          <span>Описание проекта</span>
          <textarea
            rows={2}
            value={estimate.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Краткое описание для коммерческого предложения"
          />
        </label>
      </div>

      <div className="specification-main-heading">
        <h2 className="specification-main-title">Спецификация</h2>
        <div className="specification-main-accent" aria-hidden="true" />
      </div>

      {/* Секция 1: ПО */}
      <section className="estimate-section">
        <h3 className="section-sub-title">
          <span className="icon" aria-hidden="true">
            💿
          </span>
          Программное обеспечение
        </h3>
        <div className="standard-spec-wrap">
          <div className="standard-spec" role="table" aria-label="Программное обеспечение">
            <SpecTableHeader />
            <div className="standard-spec__body" role="rowgroup">
              {softwareItems.length === 0 ? (
                <div className="standard-spec__empty">Добавьте программы из справочника</div>
              ) : (
                softwareItems.map((item, index) => (
                  <SpecRow
                    key={item.id}
                    item={item}
                    index={index}
                    removing={removingId === item.id}
                    onSchemeChange={handleSchemeChange}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                  />
                ))
              )}
            </div>
            <div className="standard-spec__foot" role="rowgroup">
              <SpecSubtotalRow
                label="Итого по разделу:"
                oneTime={softwareSubtotal.oneTime}
                recurring={softwareSubtotal.rent}
              />
            </div>
          </div>
        </div>

        <div className="add-btn-container">
          <div className="dropdown-wrapper" ref={softwareWrapperRef}>
            <button
              type="button"
              className="btn btn--outline standard-add-btn"
              onClick={() => setPicker((prev) => (prev === 'software' ? null : 'software'))}
              disabled={catalogLoading || catalog.software.length === 0}
            >
              <span className="standard-add-btn__icon" aria-hidden="true">
                💿
              </span>
              Добавить программу
            </button>
            <ProductPickerMenu
              open={picker === 'software'}
              title="Программное обеспечение"
              searchPlaceholder="Поиск программы…"
              items={catalog.software}
              onSelect={(item) => handleAddSoftware(item as SoftwareProduct)}
              onClose={closePicker}
              wrapperRef={softwareWrapperRef}
            />
          </div>
        </div>
      </section>

      {/* Секция 2: Оборудование */}
      <section className="estimate-section estimate-section--hardware">
        <h3 className="section-sub-title">
          <span className="icon" aria-hidden="true">
            🔌
          </span>
          Оборудование и комплектующие
        </h3>
        <div className="standard-spec-wrap">
          <div className="standard-spec" role="table" aria-label="Оборудование и комплектующие">
            <SpecTableHeader />
            <div className="standard-spec__body" role="rowgroup">
              {hardwareItems.length === 0 ? (
                <div className="standard-spec__empty">Добавьте оборудование из справочника</div>
              ) : (
                hardwareItems.map((item, index) => (
                  <SpecRow
                    key={item.id}
                    item={item}
                    index={index}
                    removing={removingId === item.id}
                    onSchemeChange={handleSchemeChange}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                  />
                ))
              )}
            </div>
            <div className="standard-spec__foot" role="rowgroup">
              <SpecSubtotalRow
                label="Итого по разделу:"
                oneTime={hardwareSubtotal}
              />
            </div>
          </div>
        </div>

        <div className="add-btn-container">
          <div className="dropdown-wrapper" ref={hardwareWrapperRef}>
            <button
              type="button"
              className="btn btn--outline standard-add-btn"
              onClick={() => setPicker((prev) => (prev === 'hardware' ? null : 'hardware'))}
              disabled={catalogLoading || (catalog.hardware?.length ?? 0) === 0}
            >
              <span className="standard-add-btn__icon" aria-hidden="true">
                🔌
              </span>
              Добавить оборудование
            </button>
            <ProductPickerMenu
              open={picker === 'hardware'}
              title="Оборудование"
              searchPlaceholder="Поиск оборудования…"
              items={catalog.hardware ?? []}
              onSelect={(item) => handleAddHardware(item as HardwareProduct)}
              onClose={closePicker}
              wrapperRef={hardwareWrapperRef}
            />
          </div>
        </div>
      </section>

      {/* Секция 3: Услуги */}
      <section className="estimate-section estimate-section--services">
        <h3 className="section-sub-title">
          <span className="icon" aria-hidden="true">
            🔧
          </span>
          Услуги и работы
        </h3>
        <div className="standard-spec-wrap">
          <div className="standard-spec" role="table" aria-label="Услуги и работы">
            <SpecTableHeader />
            <div className="standard-spec__body" role="rowgroup">
              {serviceItems.length === 0 ? (
                <div className="standard-spec__empty">Добавьте услуги из справочника</div>
              ) : (
                serviceItems.map((item, index) => (
                  <SpecRow
                    key={item.id}
                    item={item}
                    index={index}
                    removing={removingId === item.id}
                    onSchemeChange={handleSchemeChange}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                  />
                ))
              )}
            </div>
            <div className="standard-spec__foot" role="rowgroup">
              <SpecSubtotalRow
                label="Итого по разделу:"
                oneTime={servicesSubtotal}
              />
            </div>
          </div>
        </div>

        <div className="add-btn-container">
          <div className="dropdown-wrapper" ref={serviceWrapperRef}>
            <button
              type="button"
              className="btn btn--outline standard-add-btn"
              onClick={() => setPicker((prev) => (prev === 'service' ? null : 'service'))}
              disabled={catalogLoading || catalog.services.length === 0}
            >
              <span className="standard-add-btn__icon" aria-hidden="true">
                🔧
              </span>
              Добавить услугу
            </button>
            <ProductPickerMenu
              open={picker === 'service'}
              title="Услуги внедрения"
              searchPlaceholder="Поиск услуги…"
              items={catalog.services}
              onSelect={(item) => handleAddService(item as ServiceProduct)}
              onClose={closePicker}
              wrapperRef={serviceWrapperRef}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
