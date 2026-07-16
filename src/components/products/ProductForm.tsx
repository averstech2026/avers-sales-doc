import { FormEvent, useEffect, useState } from 'react';
import type { CatalogProduct, CatalogProductInput, CatalogProductType } from '../../types';
import { saveCatalogProduct } from '../../services/firestore';

interface ProductFormProps {
  product: CatalogProduct | null;
  /** Prefill type when creating from a specific tab */
  defaultType?: CatalogProductType;
  onSaved: (id: string) => void;
  onCancel: () => void;
}

const EMPTY_SOFTWARE: CatalogProductInput = {
  type: 'software',
  name: '',
  description: '',
  unit: 'лиц.',
  oneTimePrice: 0,
  subscriptionPrice: 0,
};

const EMPTY_SERVICE: CatalogProductInput = {
  type: 'service',
  name: '',
  description: '',
  unit: 'услуга',
  price: 0,
};

const EMPTY_HARDWARE: CatalogProductInput = {
  type: 'hardware',
  name: '',
  description: '',
  unit: 'шт.',
  price: 0,
};

function emptyForType(type: CatalogProductType): CatalogProductInput {
  if (type === 'service') return { ...EMPTY_SERVICE };
  if (type === 'hardware') return { ...EMPTY_HARDWARE };
  return { ...EMPTY_SOFTWARE };
}

export function ProductForm({ product, defaultType = 'software', onSaved, onCancel }: ProductFormProps) {
  const [form, setForm] = useState<CatalogProductInput>(emptyForType(defaultType));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setForm({
        id: product.id,
        type: product.type,
        name: product.name,
        description: product.description,
        unit: product.unit,
        oneTimePrice: product.oneTimePrice ?? 0,
        subscriptionPrice: product.subscriptionPrice ?? 0,
        price: product.price ?? 0,
        createdAt: product.createdAt,
      });
    } else {
      setForm(emptyForType(defaultType));
    }
    setError('');
  }, [product, defaultType]);

  const patch = (partial: Partial<CatalogProductInput>) => {
    setForm((prev) => ({ ...prev, ...partial }));
    setError('');
  };

  const handleTypeChange = (type: CatalogProductType) => {
    if (type === form.type) return;
    if (type === 'software') {
      patch({
        type,
        unit: form.unit === 'услуга' || form.unit === 'шт.' ? 'лиц.' : form.unit,
        oneTimePrice: form.oneTimePrice ?? form.price ?? 0,
        subscriptionPrice: form.subscriptionPrice ?? 0,
      });
    } else if (type === 'hardware') {
      patch({
        type,
        unit: form.unit === 'лиц.' || form.unit === 'услуга' ? 'шт.' : form.unit,
        price: form.price ?? form.oneTimePrice ?? 0,
      });
    } else {
      patch({
        type,
        unit: form.unit === 'лиц.' || form.unit === 'шт.' ? 'услуга' : form.unit,
        price: form.price ?? form.oneTimePrice ?? 0,
      });
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const id = await saveCatalogProduct(form);
      onSaved(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const isSoftware = form.type === 'software';
  const typeLocked = !!product;

  const typeSegments: { value: CatalogProductType; icon: string; label: string }[] = [
    { value: 'software', icon: '💿', label: 'ПО' },
    { value: 'hardware', icon: '🔌', label: 'Оборудование' },
    { value: 'service', icon: '🔧', label: 'Услуга' },
  ];

  return (
    <form className="product-form" id="productForm" onSubmit={(e) => void handleSubmit(e)}>
      <div className="field">
        <span>Тип позиции</span>
        <input type="hidden" id="itemType" value={form.type} readOnly />
        <div
          className={`type-segmented-control${typeLocked ? ' type-segmented-control--locked' : ''}`}
          role="radiogroup"
          aria-label="Тип позиции"
        >
          {typeSegments.map((segment) => (
            <button
              key={segment.value}
              type="button"
              role="radio"
              aria-checked={form.type === segment.value}
              className={`segment-btn${form.type === segment.value ? ' active' : ''}`}
              data-value={segment.value}
              disabled={typeLocked}
              onClick={() => handleTypeChange(segment.value)}
            >
              <span className="segment-icon" aria-hidden="true">
                {segment.icon}
              </span>
              <span className="segment-text">{segment.label}</span>
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>Наименование</span>
        <input
          id="itemName"
          type="text"
          value={form.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Например, Аверс. Фронт"
          required
        />
      </label>

      <label className="field">
        <span>Описание</span>
        <textarea
          id="itemDescription"
          rows={3}
          value={form.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Краткое описание для вывода в КП…"
        />
      </label>

      {isSoftware ? (
        <div className="product-form__prices" id="softwarePricesGroup">
          <label className="field">
            <span>Цена выкупа (бессрочно), ₽</span>
            <input
              id="oneTimePrice"
              type="number"
              min={0}
              value={form.oneTimePrice ?? 0}
              onChange={(e) => patch({ oneTimePrice: Math.max(0, Number(e.target.value) || 0) })}
            />
          </label>
          <label className="field">
            <span>Цена аренды (в месяц), ₽</span>
            <input
              id="subscriptionPrice"
              type="number"
              min={0}
              value={form.subscriptionPrice ?? 0}
              onChange={(e) =>
                patch({ subscriptionPrice: Math.max(0, Number(e.target.value) || 0) })
              }
            />
          </label>
        </div>
      ) : (
        <label className="field" id="servicePriceGroup">
          <span>
            {form.type === 'hardware' ? 'Стоимость оборудования, ₽' : 'Стоимость услуги, ₽'}
          </span>
          <input
            id="servicePrice"
            type="number"
            min={0}
            value={form.price ?? 0}
            onChange={(e) => patch({ price: Math.max(0, Number(e.target.value) || 0) })}
          />
        </label>
      )}

      <label className="field">
        <span>Единица измерения</span>
        <input
          id="itemUnit"
          type="text"
          value={form.unit}
          onChange={(e) => patch({ unit: e.target.value })}
          placeholder="лиц. / шт. / услуга"
        />
      </label>

      {error && <p className="product-form__error">{error}</p>}

      <div className="product-form__actions modal-confirm__actions">
        <button type="button" className="btn btn--ghost" id="closeModalBtn" onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className="btn btn-save" disabled={saving}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
}
