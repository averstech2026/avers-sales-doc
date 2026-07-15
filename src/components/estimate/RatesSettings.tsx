import { ROLES } from '../../constants/roles';
import type { Rates } from '../../types';

interface RatesSettingsProps {
  rates: Rates;
  onChange: (rates: Rates) => void;
}

export function RatesSettings({ rates, onChange }: RatesSettingsProps) {
  return (
    <div className="rates-settings">
      <p className="rates-settings__hint">
        Измените стоимость часа специалистов. Пересчёт сметы произойдёт автоматически.
      </p>
      <div className="rates-settings__grid">
        {ROLES.map((role) => (
          <label key={role.id} className="rates-settings__item">
            <span className="rates-settings__label">{role.name}</span>
            <div className="rates-settings__input-wrap">
              <input
                type="number"
                min={0}
                step={60}
                value={rates[role.id]}
                onChange={(e) =>
                  onChange({ ...rates, [role.id]: Number(e.target.value) || 0 })
                }
              />
              <span className="rates-settings__unit">₽/час</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
