interface OpacityFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function OpacityField({ label, value, onChange }: OpacityFieldProps) {
  return (
    <div className="opacity-field">
      <div className="opacity-field__header">
        <label className="opacity-field__label">{label}</label>
        <span className="opacity-field__value">{value}%</span>
      </div>
      <input
        type="range"
        className="opacity-field__range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
