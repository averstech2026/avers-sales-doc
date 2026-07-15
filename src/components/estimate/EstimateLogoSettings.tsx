import { useRef } from 'react';
import type { ClientLogoId, Estimate } from '../../types';
import {
  CLIENT_LOGO_OPTIONS,
  resolveEstimateClientLogo,
} from '../../utils/clientLogo';

interface EstimateLogoSettingsProps {
  estimate: Estimate;
  onChange: (patch: Partial<Estimate>) => void;
}

export function EstimateLogoSettings({ estimate, onChange }: EstimateLogoSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoId = estimate.clientLogoId ?? 'none';
  const previewSrc = resolveEstimateClientLogo(estimate);

  const handleSelect = (value: string) => {
    if (value === 'upload') {
      fileInputRef.current?.click();
      return;
    }
    onChange({
      clientLogoId: value as ClientLogoId,
      clientLogoCustom: value === 'custom' ? estimate.clientLogoCustom : null,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      onChange({
        clientLogoId: 'custom',
        clientLogoCustom: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const selectValue = logoId === 'custom' ? 'custom' : logoId;

  return (
    <div className="estimate-logo-settings personalization-section">
      <h3 className="estimate-logo-settings__title">Персонализация сметы</h3>
      <p className="estimate-logo-settings__hint">
        Логотип заказчика отображается в шапке этой сметы справа и попадает в PDF.
      </p>
      <div className="estimate-logo-settings__row">
        <label className="field estimate-logo-settings__field">
          <span>Логотип заказчика</span>
          <select
            className="estimate-logo-settings__select"
            value={selectValue}
            onChange={(e) => handleSelect(e.target.value)}
          >
            {CLIENT_LOGO_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
            <option value="custom" disabled={logoId !== 'custom'}>
              {logoId === 'custom' ? 'Свой файл (загружен)' : 'Свой файл'}
            </option>
            <option value="upload">Загрузить свой файл…</option>
          </select>
        </label>
        {previewSrc && (
          <div className="estimate-logo-settings__preview">
            <img src={previewSrc} alt="Логотип заказчика" />
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="personalization-settings__file-input"
        onChange={handleFileUpload}
      />
    </div>
  );
}
