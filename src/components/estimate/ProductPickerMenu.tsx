import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogItemProduct } from '../../data/products-directory';

interface ProductPickerMenuProps {
  open: boolean;
  title: string;
  searchPlaceholder?: string;
  items: CatalogItemProduct[];
  onSelect: (item: CatalogItemProduct) => void;
  onClose: () => void;
  /** Ref to the whole dropdown-wrapper (button + menu) for outside-click detection */
  wrapperRef: React.RefObject<HTMLElement | null>;
}

export function ProductPickerMenu({
  open,
  title,
  searchPlaceholder = 'Поиск по названию или описанию…',
  items,
  onSelect,
  onClose,
  wrapperRef,
}: ProductPickerMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }

    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, wrapperRef]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const haystack = `${item.name} ${item.description}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query]);

  if (!open) return null;

  return (
    <div
      className="search-dropdown"
      ref={menuRef}
      role="dialog"
      aria-label={title}
    >
      <input
        ref={searchRef}
        type="text"
        className="dropdown-search-input"
        placeholder={searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Поиск"
      />
      <div className="dropdown-results-list">
        {filtered.length === 0 ? (
          <div className="dropdown-no-results">Ничего не найдено</div>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              className="dropdown-item"
              onClick={() => {
                onSelect(item);
                onClose();
              }}
            >
              <span className="dropdown-item-title">{item.name}</span>
              {item.description && (
                <span className="dropdown-item-desc">{item.description}</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
