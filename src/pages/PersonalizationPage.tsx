import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { ColorPickerField } from '../components/ui/ColorPickerField';
import { OpacityField } from '../components/ui/OpacityField';
import { useAuth } from '../context/AuthContext';
import { usePersonalization } from '../context/PersonalizationContext';
import { isDadataPartyConfigured, lookupCompanyByInn } from '../services/dadata';
import {
  DEFAULT_ORG_SETTINGS,
  DEFAULT_THEME_COLORS,
  createThemePresetId,
  findMatchingThemePresetId,
  getAllThemePresets,
  mixWithWhite,
  orgSettingsEqual,
  themeColorsEqual,
  type OrgSettings,
  type ThemeColors,
  type ThemePreset,
} from '../utils/personalization';

type PersonalizationTab = 'organization' | 'design';

const MAX_LOGO_BYTES = 700_000;

const OPACITY_FIELDS: Array<{ key: keyof ThemeColors; label: string }> = [
  { key: 'sidebarBrandOpacity', label: 'Название «Аверс Технолоджи»' },
  { key: 'sidebarLinkOpacity', label: 'Пункты меню' },
  { key: 'sidebarGroupOpacity', label: 'Заголовки секций (Главное, Скоро)' },
];

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const isImage =
      file.type.startsWith('image/') ||
      /\.svg$/i.test(file.name) ||
      file.type === 'image/svg+xml';
    if (!isImage) {
      reject(new Error('Выберите PNG или SVG'));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      reject(new Error('Логотип слишком большой (макс. ~700 КБ). Уменьшите файл.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}

export function PersonalizationPage() {
  const { isSuperadmin } = useAuth();
  const {
    themeColors,
    orgSettings,
    customPresets,
    loading,
    saving,
    error: cloudError,
    savePersonalization,
    setCustomPresets,
  } = usePersonalization();
  const [tab, setTab] = useState<PersonalizationTab>('organization');
  const [themeDraft, setThemeDraft] = useState<ThemeColors>(themeColors);
  const [orgDraft, setOrgDraft] = useState<OrgSettings>(orgSettings);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupStatus, setLookupStatus] = useState('');
  const [logoError, setLogoError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(() =>
    findMatchingThemePresetId(themeColors, customPresets)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dadataReady = isDadataPartyConfigured();

  const allPresets = getAllThemePresets(customPresets);

  useEffect(() => {
    setThemeDraft(themeColors);
    setOrgDraft(orgSettings);
    setSaved(false);
  }, [themeColors, orgSettings]);

  useEffect(() => {
    setActivePresetId(findMatchingThemePresetId(themeDraft, customPresets));
  }, [themeDraft, customPresets]);

  const themeDirty = !themeColorsEqual(themeDraft, themeColors);
  const orgDirty = !orgSettingsEqual(orgDraft, orgSettings);
  const hasChanges = themeDirty || orgDirty;

  const updateTheme = useCallback((key: keyof ThemeColors, value: string | number) => {
    setThemeDraft((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setSaveError('');
  }, []);

  const applyPreset = useCallback((preset: ThemePreset) => {
    setThemeDraft({ ...preset.colors });
    setSaved(false);
    setSaveError('');
  }, []);

  const handleSavePreset = async () => {
    const suggested = `Мой пресет ${customPresets.length + 1}`;
    const name = window.prompt('Название пресета дизайн-схемы:', suggested);
    if (!name?.trim()) return;

    const next: ThemePreset = {
      id: createThemePresetId(),
      name: name.trim(),
      builtin: false,
      colors: { ...themeDraft },
    };
    setSaveError('');
    try {
      await setCustomPresets([...customPresets, next]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Не удалось сохранить пресет');
    }
  };

  const handleRenamePreset = async (preset: ThemePreset) => {
    if (preset.builtin) return;
    const name = window.prompt('Новое название пресета:', preset.name);
    if (!name?.trim()) return;
    setSaveError('');
    try {
      await setCustomPresets(
        customPresets.map((item) =>
          item.id === preset.id ? { ...item, name: name.trim() } : item
        )
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Не удалось переименовать пресет');
    }
  };

  const handleDeletePreset = async (preset: ThemePreset) => {
    if (preset.builtin) return;
    if (!window.confirm(`Удалить пресет «${preset.name}»?`)) return;
    setSaveError('');
    try {
      await setCustomPresets(customPresets.filter((item) => item.id !== preset.id));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Не удалось удалить пресет');
    }
  };

  const updateOrg = useCallback((partial: Partial<OrgSettings>) => {
    setOrgDraft((prev) => ({ ...prev, ...partial }));
    setSaved(false);
    setSaveError('');
    setLookupError('');
    setLookupStatus('');
  }, []);

  const handleSave = async () => {
    setSaveError('');
    try {
      await savePersonalization({
        theme: themeDirty ? themeDraft : undefined,
        organization: orgDirty ? orgDraft : undefined,
      });
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Не удалось сохранить в облако');
    }
  };

  const handleResetTheme = () => {
    setThemeDraft({ ...DEFAULT_THEME_COLORS });
    setSaved(false);
  };

  const handleResetOrg = () => {
    setOrgDraft({ ...DEFAULT_ORG_SETTINGS });
    setSaved(false);
    setLookupError('');
    setLookupStatus('');
  };

  const handleAutoHighlight = () => {
    setThemeDraft((prev) => ({
      ...prev,
      highlightBg: mixWithWhite(prev.button, 0.92),
    }));
    setSaved(false);
  };

  const handleLookupByInn = async () => {
    setLookupError('');
    setLookupStatus('');
    const innDigits = orgDraft.inn.replace(/\D/g, '');
    if (innDigits.length !== 10 && innDigits.length !== 12) {
      setLookupError('Пожалуйста, введите корректный ИНН организации (10 или 12 цифр)');
      return;
    }

    setLookingUp(true);
    try {
      const result = await lookupCompanyByInn(innDigits);
      setOrgDraft((prev) => ({
        ...prev,
        inn: result.inn || prev.inn,
        fullName: result.name || prev.fullName,
        ogrn: result.ogrn || prev.ogrn,
        kpp: result.kpp || prev.kpp,
        legalAddress: result.legalAddress || prev.legalAddress,
      }));
      setLookupStatus('Реквизиты заполнены по данным ЕГРЮЛ. Расчётный счёт укажите вручную.');
      setSaved(false);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Не удалось найти компанию по ИНН');
    } finally {
      setLookingUp(false);
    }
  };

  const applyLogoFile = async (file: File | undefined) => {
    if (!file) return;
    setLogoError('');
    try {
      const dataUrl = await readImageAsDataUrl(file);
      updateOrg({ logoDataUrl: dataUrl });
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Ошибка загрузки логотипа');
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    void applyLogoFile(event.dataTransfer.files?.[0]);
  };

  if (!isSuperadmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="page personalization-page page--loading">
        <p className="muted">Загрузка персонализации из облака…</p>
      </div>
    );
  }

  const innDigits = orgDraft.inn.replace(/\D/g, '');
  const canLookup =
    dadataReady && !lookingUp && (innDigits.length === 10 || innDigits.length === 12);
  const statusError = saveError || cloudError;

  return (
    <div className="page personalization-page personalization-section">
      <header className="page-header">
        <div>
          <h1>Персонализация</h1>
          <p className="page-header__sub">
            Централизованное управление реквизитами организации, дизайн-системой и цветами интерфейса
            для смет, договоров и КП. Настройки хранятся в Firestore и общие для всей команды.
          </p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void handleSave()}
            disabled={saving || (!hasChanges && saved)}
          >
            {saving ? 'Сохранение…' : saved && !hasChanges ? 'Сохранено' : 'Сохранить'}
          </button>
        </div>
      </header>

      {statusError && <p className="company-form__error personalization-page__error">{statusError}</p>}

      <div
        className="tabs-segmented-control personalization-page__tabs"
        role="tablist"
        aria-label="Разделы персонализации"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'organization'}
          className={`tab-btn${tab === 'organization' ? ' active' : ''}`}
          onClick={() => setTab('organization')}
        >
          Организация
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'design'}
          className={`tab-btn${tab === 'design' ? ' active' : ''}`}
          onClick={() => setTab('design')}
        >
          Дизайн-схема
        </button>
      </div>

      {tab === 'organization' && (
        <section className="personalization-panel" role="tabpanel">
          <h2 className="personalization-panel__title">Организация и юридические данные</h2>
          <p className="personalization-panel__hint">
            Реквизиты используются при автогенерации смет, договоров и коммерческих предложений.
          </p>

          <div className="company-form__inn-row">
            <label className="field company-form__inn-field" htmlFor="company-inn-input">
              <span>ИНН</span>
              <input
                id="company-inn-input"
                type="text"
                value={orgDraft.inn}
                onChange={(e) => updateOrg({ inn: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (canLookup) void handleLookupByInn();
                  }
                }}
                placeholder="7707083893"
                inputMode="numeric"
              />
            </label>
            <button
              type="button"
              className="btn btn--primary company-form__inn-btn"
              onClick={() => void handleLookupByInn()}
              disabled={!canLookup}
              title={
                dadataReady
                  ? 'Подтянуть реквизиты из DaData'
                  : 'Задайте DADATA_API_KEY (dev) или VITE_DADATA_PARTY_URL (prod)'
              }
            >
              {lookingUp ? 'Поиск…' : 'Заполнить реквизиты'}
            </button>
            {lookingUp && (
              <span id="inn-search-loader" className="personalization-page__loader" aria-live="polite">
                Загрузка…
              </span>
            )}
          </div>
          <p className="muted company-form__inn-hint">
            {dadataReady
              ? 'Введите 10 или 12 цифр и нажмите «Заполнить реквизиты» — подставятся ОГРН, КПП, наименование и адрес.'
              : 'Поиск по ИНН: добавьте DADATA_API_KEY в .env и перезапустите dev-сервер (для прода — VITE_DADATA_PARTY_URL).'}
          </p>

          <div className="company-form__grid personalization-page__org-grid">
            <label className="field field--wide" htmlFor="company-full-name">
              <span>Полное наименование</span>
              <input
                id="company-full-name"
                type="text"
                value={orgDraft.fullName}
                onChange={(e) => updateOrg({ fullName: e.target.value })}
                placeholder='ООО «Аверс Технолоджи»'
              />
            </label>
            <label className="field" htmlFor="company-ogrn">
              <span>ОГРН</span>
              <input
                id="company-ogrn"
                type="text"
                value={orgDraft.ogrn}
                onChange={(e) => updateOrg({ ogrn: e.target.value })}
                placeholder="1027700000000"
                inputMode="numeric"
              />
            </label>
            <label className="field" htmlFor="company-kpp">
              <span>КПП</span>
              <input
                id="company-kpp"
                type="text"
                value={orgDraft.kpp}
                onChange={(e) => updateOrg({ kpp: e.target.value })}
                placeholder="770001001"
                inputMode="numeric"
              />
            </label>
            <label className="field field--wide" htmlFor="company-legal-address">
              <span>Юридический адрес</span>
              <input
                id="company-legal-address"
                type="text"
                value={orgDraft.legalAddress}
                onChange={(e) => updateOrg({ legalAddress: e.target.value })}
                placeholder="г. Москва, ул. Примерная, д. 1"
              />
            </label>
            <label className="field" htmlFor="company-bank-account">
              <span>Расчётный счёт</span>
              <input
                id="company-bank-account"
                type="text"
                value={orgDraft.bankAccount}
                onChange={(e) => updateOrg({ bankAccount: e.target.value })}
                placeholder="40702810…"
                inputMode="numeric"
              />
            </label>
            <label className="field">
              <span>БИК</span>
              <input
                type="text"
                value={orgDraft.bik}
                onChange={(e) => updateOrg({ bik: e.target.value })}
                placeholder="044525225"
                inputMode="numeric"
              />
            </label>
            <label className="field field--wide">
              <span>Банк</span>
              <input
                type="text"
                value={orgDraft.bankName}
                onChange={(e) => updateOrg({ bankName: e.target.value })}
                placeholder="ПАО Сбербанк"
              />
            </label>
          </div>

          {lookupStatus && <p className="company-form__status">{lookupStatus}</p>}
          {lookupError && <p className="company-form__error">{lookupError}</p>}

          <h3 className="personalization-panel__subtitle">Брендинг</h3>
          <p className="personalization-panel__hint personalization-panel__hint--compact">
            Основной логотип организации (PNG или SVG). Используется в документах и на слайдах.
          </p>

          <div
            className={`personalization-dropzone${dragOver ? ' personalization-dropzone--active' : ''}${
              orgDraft.logoDataUrl ? ' personalization-dropzone--filled' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            {orgDraft.logoDataUrl ? (
              <img src={orgDraft.logoDataUrl} alt="Логотип организации" className="personalization-dropzone__preview" />
            ) : (
              <div className="personalization-dropzone__placeholder">
                <span className="personalization-dropzone__icon" aria-hidden="true">
                  ⇧
                </span>
                <span>Перетащите PNG/SVG сюда или нажмите для выбора</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/svg+xml,.png,.svg"
              className="personalization-settings__file-input"
              onChange={(e) => {
                void applyLogoFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
          {orgDraft.logoDataUrl && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => updateOrg({ logoDataUrl: null })}
            >
              Удалить логотип
            </button>
          )}
          {logoError && <p className="company-form__error">{logoError}</p>}

          <div className="personalization-settings__toolbar">
            <button type="button" className="btn btn--outline" onClick={handleResetOrg}>
              Очистить реквизиты
            </button>
          </div>
        </section>
      )}

      {tab === 'design' && (
        <section className="personalization-panel" role="tabpanel">
          <h2 className="personalization-panel__title">Дизайн-схема</h2>
          <p className="personalization-panel__hint">
            Единое управление кнопками, бейджами, декором и меню. «Создать смету» (синяя) и «Создать
            КП» (зелёная) настраиваются отдельно — так и должно быть.
          </p>

          <div className="theme-presets">
            <div className="theme-presets__header">
              <h3 className="theme-presets__title">Пресеты</h3>
              <button
                type="button"
                className="btn-add-preset"
                onClick={() => void handleSavePreset()}
                disabled={saving}
              >
                + Сохранить как пресет
              </button>
            </div>
            <div className="theme-presets__list" role="list">
              {allPresets.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    className={`theme-preset-chip${isActive ? ' theme-preset-chip--active' : ''}`}
                    role="listitem"
                  >
                    <button
                      type="button"
                      className="theme-preset-chip__main"
                      onClick={() => applyPreset(preset)}
                      title={`Применить «${preset.name}»`}
                    >
                      <span className="theme-preset-chip__swatches" aria-hidden="true">
                        <span style={{ background: preset.colors.createProject }} />
                        <span style={{ background: preset.colors.saveButton }} />
                        <span style={{ background: preset.colors.button }} />
                      </span>
                      <span className="theme-preset-chip__name">{preset.name}</span>
                      {preset.builtin ? (
                        <span className="theme-preset-chip__badge">готово</span>
                      ) : null}
                    </button>
                    {!preset.builtin && (
                      <span className="theme-preset-chip__actions">
                        <button
                          type="button"
                          className="preset-action-btn"
                          onClick={() => void handleRenamePreset(preset)}
                          title="Переименовать"
                          aria-label={`Переименовать «${preset.name}»`}
                          disabled={saving}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="preset-action-btn delete"
                          onClick={() => void handleDeletePreset(preset)}
                          title="Удалить"
                          aria-label={`Удалить «${preset.name}»`}
                          disabled={saving}
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="personalization-ds-grid">
            <article className="personalization-ds-card">
              <h3 className="personalization-ds-card__title">Создание</h3>
              <p className="personalization-ds-card__hint">
                Два разных CTA: проектная смета и типовое КП
              </p>
              <ColorPickerField
                label="«Создать смету» (проектная)"
                value={themeDraft.createProject}
                onChange={(value) => updateTheme('createProject', value)}
              />
              <ColorPickerField
                label="«Создать КП» / «Сохранить в облако»"
                value={themeDraft.saveButton}
                onChange={(value) => updateTheme('saveButton', value)}
              />
              <ColorPickerField
                label="Текст на кнопках создания"
                value={themeDraft.uiPrimaryText}
                onChange={(value) => updateTheme('uiPrimaryText', value)}
              />
              <div className="personalization-ds-card__preview personalization-ds-card__preview--row">
                <button
                  type="button"
                  className="btn btn-save btn-save--project"
                  style={{
                    backgroundColor: themeDraft.createProject,
                    color: themeDraft.uiPrimaryText,
                    borderRadius: themeDraft.uiBorderRadius,
                  }}
                >
                  Создать смету
                </button>
                <button
                  type="button"
                  className="btn btn-save btn-save--standard"
                  style={{
                    backgroundColor: themeDraft.saveButton,
                    color: themeDraft.uiPrimaryText,
                    borderRadius: themeDraft.uiBorderRadius,
                  }}
                >
                  Создать КП
                </button>
              </div>
              <p className="personalization-ds-card__hint">
                Бейджи «Проектная» / «Типовая» наследуют эти цвета автоматически.
              </p>
            </article>

            <article className="personalization-ds-card">
              <h3 className="personalization-ds-card__title">Кнопки действий</h3>
              <p className="personalization-ds-card__hint">
                Secondary («Изменить»), Danger («Удалить»), действия на слайдах
              </p>
              <ColorPickerField
                label="Secondary — фон («Изменить»)"
                value={themeDraft.uiSecondaryBg}
                onChange={(value) => updateTheme('uiSecondaryBg', value)}
              />
              <ColorPickerField
                label="Secondary — рамка"
                value={themeDraft.uiSecondaryBorder}
                onChange={(value) => updateTheme('uiSecondaryBorder', value)}
              />
              <ColorPickerField
                label="Secondary — текст"
                value={themeDraft.uiSecondaryText}
                onChange={(value) => updateTheme('uiSecondaryText', value)}
              />
              <ColorPickerField
                label="Danger — фон / текст («Удалить»)"
                value={themeDraft.uiDangerBg}
                onChange={(value) => updateTheme('uiDangerBg', value)}
              />
              <ColorPickerField
                label="Danger — текст на залитой кнопке"
                value={themeDraft.uiDangerText}
                onChange={(value) => updateTheme('uiDangerText', value)}
              />
              <ColorPickerField
                label="Слайд: «Редактировать»"
                value={themeDraft.slideEditBg}
                onChange={(value) => updateTheme('slideEditBg', value)}
              />
              <ColorPickerField
                label="Слайд: «Просмотр» — фон"
                value={themeDraft.slideViewBg}
                onChange={(value) => updateTheme('slideViewBg', value)}
              />
              <ColorPickerField
                label="Слайд: «Просмотр» — текст"
                value={themeDraft.slideViewText}
                onChange={(value) => updateTheme('slideViewText', value)}
              />
              <div className="personalization-ds-card__preview personalization-ds-card__preview--row">
                <button
                  type="button"
                  className="btn btn--ghost"
                  style={{
                    backgroundColor: themeDraft.uiSecondaryBg,
                    borderColor: themeDraft.uiSecondaryBorder,
                    color: themeDraft.uiSecondaryText,
                    borderRadius: themeDraft.uiBorderRadius,
                  }}
                >
                  Изменить
                </button>
                <button
                  type="button"
                  className="btn btn--ghost company-card__delete"
                  style={{
                    backgroundColor: themeDraft.uiSecondaryBg,
                    borderColor: themeDraft.uiSecondaryBorder,
                    color: themeDraft.uiDangerBg,
                    borderRadius: themeDraft.uiBorderRadius,
                  }}
                >
                  Удалить
                </button>
                <button
                  type="button"
                  className="btn-action-edit"
                  style={{ backgroundColor: themeDraft.slideEditBg, flex: 'none' }}
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  className="btn-action-view"
                  style={{
                    backgroundColor: themeDraft.slideViewBg,
                    color: themeDraft.slideViewText,
                    borderColor: themeDraft.slideViewBorder,
                    flex: 'none',
                  }}
                >
                  Просмотр
                </button>
              </div>
            </article>

            <article className="personalization-ds-card">
              <h3 className="personalization-ds-card__title">Декор и акценты</h3>
              <p className="personalization-ds-card__hint">Уголки, подсветка, таблицы, линии</p>
              <ColorPickerField
                label="Акцент (иконки, правила)"
                value={themeDraft.button}
                onChange={(value) => updateTheme('button', value)}
              />
              <ColorPickerField
                label="Уголки акцентные"
                value={themeDraft.cornersAccent}
                onChange={(value) => updateTheme('cornersAccent', value)}
              />
              <ColorPickerField
                label="Уголки основные"
                value={themeDraft.cornersNeutral}
                onChange={(value) => updateTheme('cornersNeutral', value)}
              />
              <ColorPickerField
                label="Фон подсветки"
                value={themeDraft.highlightBg}
                onChange={(value) => updateTheme('highlightBg', value)}
              />
              <ColorPickerField
                label="Заголовки таблиц"
                value={themeDraft.tableHeader}
                onChange={(value) => updateTheme('tableHeader', value)}
              />
              <ColorPickerField
                label="Разделительные линии"
                value={themeDraft.divider}
                onChange={(value) => updateTheme('divider', value)}
              />
              <ColorPickerField
                label="Иконки действий (карточки)"
                value={themeDraft.actionMute}
                onChange={(value) => updateTheme('actionMute', value)}
              />
              <div
                className="personalization-ds-card__preview"
                style={{
                  borderTopColor: themeDraft.divider,
                  background: themeDraft.highlightBg,
                  borderRadius: themeDraft.uiBorderRadius,
                  padding: 12,
                }}
              >
                <span
                  className="type-badge badge-project"
                  style={{
                    backgroundColor: mixWithWhite(themeDraft.createProject, 0.9),
                    color: themeDraft.createProject,
                    borderColor: mixWithWhite(themeDraft.createProject, 0.7),
                  }}
                >
                  Проектная
                </span>{' '}
                <span
                  className="type-badge badge-standard"
                  style={{
                    backgroundColor: mixWithWhite(themeDraft.saveButton, 0.9),
                    color: themeDraft.saveButton,
                    borderColor: mixWithWhite(themeDraft.saveButton, 0.7),
                  }}
                >
                  Типовая
                </span>
              </div>
            </article>

            <article className="personalization-ds-card">
              <h3 className="personalization-ds-card__title">Меню и формы</h3>
              <p className="personalization-ds-card__hint">Сайдбар и поля ввода</p>
              <ColorPickerField
                label="Фон бокового меню"
                value={themeDraft.sidebarBg}
                onChange={(value) => updateTheme('sidebarBg', value)}
              />
              <ColorPickerField
                label="Активный пункт меню"
                value={themeDraft.sidebarActive}
                onChange={(value) => updateTheme('sidebarActive', value)}
              />
              <ColorPickerField
                label="Текст меню"
                value={themeDraft.sidebarText}
                onChange={(value) => updateTheme('sidebarText', value)}
              />
              <ColorPickerField
                label="Фокус поля ввода"
                value={themeDraft.uiInputFocus}
                onChange={(value) => updateTheme('uiInputFocus', value)}
              />
              <label className="field">
                <span>Высота инпутов (px)</span>
                <input
                  type="number"
                  min={28}
                  max={64}
                  value={themeDraft.uiInputHeight}
                  onChange={(e) => updateTheme('uiInputHeight', Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span>Скругление (px)</span>
                <input
                  type="number"
                  min={0}
                  max={32}
                  value={themeDraft.uiBorderRadius}
                  onChange={(e) => updateTheme('uiBorderRadius', Number(e.target.value))}
                />
              </label>
              <div className="opacity-field-grid" style={{ marginTop: 8 }}>
                {OPACITY_FIELDS.map((field) => (
                  <OpacityField
                    key={field.key}
                    label={field.label}
                    value={themeDraft[field.key] as number}
                    onChange={(value) => updateTheme(field.key, value)}
                  />
                ))}
              </div>
            </article>
          </div>

          <div className="personalization-settings__toolbar">
            <div className="personalization-settings__actions">
              <button type="button" className="btn btn--ghost" onClick={handleAutoHighlight}>
                Подобрать фон подсветки от акцента
              </button>
              <button type="button" className="btn btn--outline" onClick={handleResetTheme}>
                Сбросить к Аверс
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
