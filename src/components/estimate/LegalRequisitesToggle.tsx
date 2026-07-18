import { isLegalRequisitesIncluded } from '../../utils/legalRequisites';
import type { Estimate } from '../../types';

interface LegalRequisitesToggleProps {
  estimate: Estimate;
  onChange: (patch: Partial<Estimate>) => void;
}

export function LegalRequisitesToggle({ estimate, onChange }: LegalRequisitesToggleProps) {
  const checked = isLegalRequisitesIncluded(estimate.includeLegalRequisites);

  return (
    <div className="export-settings-option">
      <label className="ui-switch" htmlFor="toggle-include-requisites">
        <input
          type="checkbox"
          id="toggle-include-requisites"
          checked={checked}
          onChange={(e) => onChange({ includeLegalRequisites: e.target.checked })}
        />
        <span className="ui-switch__slider" aria-hidden="true" />
      </label>
      <span className="export-settings-option__label">
        Добавить юридические реквизиты в подвал
      </span>
    </div>
  );
}
