import { useEffect, useState } from 'react';
import { ColorPickerField } from '../ui/ColorPickerField';
import { usePersonalization } from '../../context/PersonalizationContext';
import {
  DEFAULT_THEME_COLORS,
  mixWithWhite,
  themeColorsEqual,
  type ThemeColors,
} from '../../utils/personalization';

interface PersonalizationSettingsProps {
  open?: boolean;
  onSaved?: () => void;
}

const COLOR_FIELDS: Array<{ key: keyof ThemeColors; label: string }> = [
  { key: 'sidebarBg', label: 'Фон бокового меню' },
  { key: 'sidebarActive', label: 'Выделение в меню (активный пункт)' },
  { key: 'sidebarText', label: 'Цвет шрифта в меню' },
  { key: 'button', label: 'Кнопки и основные действия' },
  { key: 'saveButton', label: 'Кнопки «Создать смету» и «Сохранить в облако»' },
  { key: 'tableHeader', label: 'Заголовки таблиц сметы' },
  { key: 'highlightBg', label: 'Фон подсветки (итоги, карточки)' },
  { key: 'cornersAccent', label: 'Уголки акцентные (верх-справа, низ-слева)' },
  { key: 'cornersNeutral', label: 'Уголки основные (верх-слева, низ-справа)' },
];

export function PersonalizationSettings({ open = true, onSaved }: PersonalizationSettingsProps) {
  const { themeColors, setThemeColors } = usePersonalization();
  const [draft, setDraft] = useState<ThemeColors>(themeColors);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(themeColors);
      setSaved(false);
    }
  }, [open, themeColors]);

  const hasChanges = !themeColorsEqual(draft, themeColors);

  const updateDraft = (key: keyof ThemeColors, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setThemeColors(draft);
    setSaved(true);
    onSaved?.();
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_THEME_COLORS });
    setSaved(false);
  };

  const handleAutoHighlight = () => {
    setDraft((prev) => ({
      ...prev,
      highlightBg: mixWithWhite(prev.button, 0.92),
    }));
    setSaved(false);
  };

  return (
    <div className="personalization-settings personalization-section">
      <section className="personalization-settings__section">
        <h3 className="personalization-settings__title">Цветовая тема</h3>
        <p className="personalization-settings__hint">
          Настройте цвета отдельно для меню, кнопок, сохранения, таблиц, подсветки и уголков. Нажмите
          «Сохранить» для применения.
        </p>

        <div className="color-picker-grid">
          {COLOR_FIELDS.map((field) => (
            <ColorPickerField
              key={field.key}
              label={field.label}
              value={draft[field.key]}
              onChange={(value) => updateDraft(field.key, value)}
            />
          ))}
        </div>

        <div className="personalization-settings__toolbar">
          <div className="personalization-settings__actions">
            <button type="button" className="btn btn--ghost" onClick={handleAutoHighlight}>
              Подобрать фон подсветки от кнопок
            </button>
            <button type="button" className="btn btn--outline" onClick={handleReset}>
              Сбросить к Аверс
            </button>
          </div>
          <div className="personalization-settings__save">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSave}
              disabled={!hasChanges && saved}
            >
              {saved && !hasChanges ? 'Сохранено' : 'Сохранить'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
