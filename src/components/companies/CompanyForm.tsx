import { FormEvent, useEffect, useRef, useState } from 'react';
import type { Company, CompanyInput } from '../../types';
import { COMPANY_DEFAULTS } from '../../models/firestore';
import { saveCompany } from '../../services/firestore';
import { isDadataPartyConfigured, lookupCompanyByInn } from '../../services/dadata';

interface CompanyFormProps {
  company: Company | null;
  onSaved: (id: string) => void;
  onCancel: () => void;
}

const EMPTY_FORM: CompanyInput = {
  ...COMPANY_DEFAULTS,
};

const MAX_LOGO_BYTES = 700_000;

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Выберите файл изображения'));
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

export function CompanyForm({ company, onSaved, onCancel }: CompanyFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CompanyInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState('');
  const [lookupStatus, setLookupStatus] = useState('');
  const dadataReady = isDadataPartyConfigured();

  useEffect(() => {
    if (company) {
      setForm({
        id: company.id,
        name: company.name,
        inn: company.inn,
        kpp: company.kpp,
        ogrn: company.ogrn,
        legalAddress: company.legalAddress,
        bankAccount: company.bankAccount,
        bik: company.bik,
        bankName: company.bankName,
        director: company.director,
        directorBasis: company.directorBasis,
        logoDataUrl: company.logoDataUrl ?? null,
        createdAt: company.createdAt,
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
    setError('');
    setLookupStatus('');
  }, [company]);

  const patch = (partial: Partial<CompanyInput>) => {
    setForm((prev) => ({ ...prev, ...partial }));
    setError('');
    setLookupStatus('');
  };

  const handleLookupByInn = async () => {
    setError('');
    setLookupStatus('');
    setLookingUp(true);
    try {
      const result = await lookupCompanyByInn(form.inn);
      setForm((prev) => ({
        ...prev,
        name: result.name || prev.name,
        inn: result.inn || prev.inn,
        kpp: result.kpp || prev.kpp,
        ogrn: result.ogrn || prev.ogrn,
        legalAddress: result.legalAddress || prev.legalAddress,
        director: result.director || prev.director,
        directorBasis: result.directorBasis || prev.directorBasis || COMPANY_DEFAULTS.directorBasis,
      }));
      setLookupStatus('Реквизиты заполнены по данным DaData. Банк укажите вручную при необходимости.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось найти компанию по ИНН');
    } finally {
      setLookingUp(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      patch({ logoDataUrl: dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки логотипа');
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const id = await saveCompany(form);
      onSaved(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить компанию');
    } finally {
      setSaving(false);
    }
  };

  const innDigits = form.inn.replace(/\D/g, '');
  const canLookup =
    dadataReady && !lookingUp && !saving && (innDigits.length === 10 || innDigits.length === 12);

  return (
    <form className="company-form" onSubmit={handleSubmit}>
      <div className="company-form__logo">
        <div className="company-form__logo-preview">
          {form.logoDataUrl ? (
            <img src={form.logoDataUrl} alt="" />
          ) : (
            <span className="company-form__logo-placeholder">🏢</span>
          )}
        </div>
        <div className="company-form__logo-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => fileInputRef.current?.click()}
          >
            {form.logoDataUrl ? 'Заменить логотип' : 'Загрузить логотип'}
          </button>
          {form.logoDataUrl && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => patch({ logoDataUrl: null })}
            >
              Удалить
            </button>
          )}
          <p className="muted company-form__logo-hint">PNG, JPG или SVG, до ~700 КБ</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="company-form__file-input"
          onChange={handleLogoUpload}
        />
      </div>

      <div className="company-form__inn-row">
        <label className="field company-form__inn-field">
          <span>ИНН</span>
          <input
            type="text"
            value={form.inn}
            onChange={(e) => patch({ inn: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (canLookup) void handleLookupByInn();
              }
            }}
            placeholder="7707083893"
            inputMode="numeric"
            autoFocus={!company}
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
          {lookingUp ? 'Поиск…' : 'Заполнить по ИНН'}
        </button>
      </div>
      <p className="muted company-form__inn-hint">
        {dadataReady
          ? 'Введите 10 или 12 цифр и нажмите «Заполнить по ИНН» — подставятся название, КПП, ОГРН, адрес и руководитель.'
          : 'Поиск по ИНН: добавьте DADATA_API_KEY в .env и перезапустите dev-сервер (для прода — VITE_DADATA_PARTY_URL).'}
      </p>

      <div className="company-form__grid">
        <label className="field field--wide">
          <span>Название *</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder='ООО «Заказчик»'
            required
          />
        </label>

        <label className="field">
          <span>КПП</span>
          <input
            type="text"
            value={form.kpp}
            onChange={(e) => patch({ kpp: e.target.value })}
            placeholder="770001001"
            inputMode="numeric"
          />
        </label>

        <label className="field">
          <span>ОГРН</span>
          <input
            type="text"
            value={form.ogrn}
            onChange={(e) => patch({ ogrn: e.target.value })}
            placeholder="1027700000000"
            inputMode="numeric"
          />
        </label>

        <label className="field field--wide">
          <span>Юридический адрес</span>
          <input
            type="text"
            value={form.legalAddress}
            onChange={(e) => patch({ legalAddress: e.target.value })}
            placeholder="г. Москва, ул. Примерная, д. 1"
          />
        </label>

        <label className="field">
          <span>Расчётный счёт</span>
          <input
            type="text"
            value={form.bankAccount}
            onChange={(e) => patch({ bankAccount: e.target.value })}
            placeholder="40702810…"
            inputMode="numeric"
          />
        </label>

        <label className="field">
          <span>БИК</span>
          <input
            type="text"
            value={form.bik}
            onChange={(e) => patch({ bik: e.target.value })}
            placeholder="044525225"
            inputMode="numeric"
          />
        </label>

        <label className="field field--wide">
          <span>Банк</span>
          <input
            type="text"
            value={form.bankName}
            onChange={(e) => patch({ bankName: e.target.value })}
            placeholder="ПАО Сбербанк"
          />
        </label>

        <label className="field">
          <span>Руководитель</span>
          <input
            type="text"
            value={form.director}
            onChange={(e) => patch({ director: e.target.value })}
            placeholder="Иванов И. И."
          />
        </label>

        <label className="field">
          <span>Действует на основании</span>
          <input
            type="text"
            value={form.directorBasis}
            onChange={(e) => patch({ directorBasis: e.target.value })}
            placeholder="Устава"
          />
        </label>
      </div>

      {lookupStatus && <p className="company-form__status">{lookupStatus}</p>}
      {error && <p className="company-form__error">{error}</p>}

      <div className="company-form__toolbar">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving || lookingUp}>
          Отмена
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving || lookingUp}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
}
