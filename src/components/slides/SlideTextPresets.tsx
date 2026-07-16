import { useEffect, useState } from 'react';
import type { PresentationSlideContent } from '../../utils/presentationSlides';
import {
  DEFAULT_PRESET_ID,
  applySlideTextPreset,
  createSlideTextPresetId,
  extractSlideTextPreset,
  getDefaultSlideTextPreset,
  loadSlideTextPresets,
  saveSlideTextPresets,
  type SlideTextPreset,
} from '../../utils/slideTextPresets';

interface SlideTextPresetsProps {
  slideId: string;
  draft: PresentationSlideContent;
  disabled?: boolean;
  onApply: (next: PresentationSlideContent) => void;
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function SlideTextPresets({ slideId, draft, disabled, onApply }: SlideTextPresetsProps) {
  const [presets, setPresets] = useState<SlideTextPreset[]>([]);
  const [activeId, setActiveId] = useState<string>(DEFAULT_PRESET_ID);

  useEffect(() => {
    setPresets(loadSlideTextPresets(slideId));
    setActiveId(DEFAULT_PRESET_ID);
  }, [slideId]);

  const persist = (next: SlideTextPreset[]) => {
    setPresets(next);
    saveSlideTextPresets(slideId, next);
  };

  const handleSelectDefault = () => {
    const texts = getDefaultSlideTextPreset(slideId);
    onApply(applySlideTextPreset(draft, texts));
    setActiveId(DEFAULT_PRESET_ID);
  };

  const handleSelectPreset = (preset: SlideTextPreset) => {
    onApply(applySlideTextPreset(draft, preset.texts));
    setActiveId(preset.id);
  };

  const handleCreate = () => {
    const suggested = `Вариант ${presets.length + 1}`;
    const name = window.prompt(
      'Название варианта текста (например, «Для столовых», «Краткий»):',
      suggested
    );
    if (!name?.trim()) return;

    const preset: SlideTextPreset = {
      id: createSlideTextPresetId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      texts: extractSlideTextPreset(draft),
    };
    const next = [...presets, preset];
    persist(next);
    setActiveId(preset.id);
  };

  const handleRename = (preset: SlideTextPreset) => {
    const name = window.prompt('Новое имя для варианта:', preset.name);
    if (!name?.trim()) return;
    persist(
      presets.map((item) =>
        item.id === preset.id ? { ...item, name: name.trim() } : item
      )
    );
  };

  const handleDelete = (preset: SlideTextPreset) => {
    if (!window.confirm(`Удалить вариант «${preset.name}»?`)) return;
    const next = presets.filter((item) => item.id !== preset.id);
    persist(next);
    if (activeId === preset.id) {
      handleSelectDefault();
    }
  };

  return (
    <div className="presets-section">
      <div className="presets-header">
        <span className="presets-title">Варианты текстов для этого слайда</span>
        <button
          type="button"
          className="btn-add-preset"
          onClick={handleCreate}
          disabled={disabled}
        >
          <PlusIcon />
          Сохранить текущий как вариант
        </button>
      </div>

      <div className="presets-list" role="tablist" aria-label="Варианты текстов слайда">
        <button
          type="button"
          role="tab"
          className={`preset-tab${activeId === DEFAULT_PRESET_ID ? ' active' : ''}`}
          aria-selected={activeId === DEFAULT_PRESET_ID}
          onClick={handleSelectDefault}
          disabled={disabled}
        >
          <span className="preset-name">Стандартный</span>
        </button>

        {presets.map((preset) => (
          <div
            key={preset.id}
            role="tab"
            className={`preset-tab${activeId === preset.id ? ' active' : ''}`}
            aria-selected={activeId === preset.id}
            onClick={() => !disabled && handleSelectPreset(preset)}
            onKeyDown={(e) => {
              if (disabled) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectPreset(preset);
              }
            }}
            tabIndex={disabled ? -1 : 0}
          >
            <span className="preset-name">{preset.name}</span>
            <div
              className="preset-actions"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="preset-action-btn"
                title="Переименовать"
                aria-label={`Переименовать «${preset.name}»`}
                disabled={disabled}
                onClick={() => handleRename(preset)}
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                className="preset-action-btn delete"
                title="Удалить вариант"
                aria-label={`Удалить «${preset.name}»`}
                disabled={disabled}
                onClick={() => handleDelete(preset)}
              >
                <CloseIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
