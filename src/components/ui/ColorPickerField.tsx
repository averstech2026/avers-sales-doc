import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  hexToHsv,
  hsvToHex,
  normalizeHex,
  THEME_COLOR_PALETTE,
  type Hsv,
} from '../../utils/personalization';

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function EyedropperIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20l2.5-2.5M14.5 5.5l4 4M12.5 7.5l-2 2 6 6 2-2M9.5 10.5L7 13l1.5 1.5 2.5-2.5M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4 10.5-10.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ColorPickerField({ label, value, onChange }: ColorPickerFieldProps) {
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value));
  const eyeDropperSupported =
    typeof window !== 'undefined' && 'EyeDropper' in window;

  useEffect(() => {
    const normalized = normalizeHex(value);
    setHexInput(normalized);
    setHsv(hexToHsv(normalized));
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const commitHex = useCallback(
    (hex: string) => {
      const normalized = normalizeHex(hex, value);
      onChange(normalized);
      setHexInput(normalized);
      setHsv(hexToHsv(normalized));
    },
    [onChange, value]
  );

  const updateHsv = useCallback(
    (patch: Partial<Hsv>) => {
      setHsv((prev) => {
        const next = { ...prev, ...patch };
        const normalized = normalizeHex(hsvToHex(next.h, next.s, next.v), value);
        onChange(normalized);
        setHexInput(normalized);
        return next;
      });
    },
    [onChange, value]
  );

  const handleHexInputChange = (raw: string) => {
    setHexInput(raw);
    if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(raw.trim())) {
      commitHex(raw.startsWith('#') ? raw : `#${raw}`);
    }
  };

  const pickSv = (clientX: number, clientY: number) => {
    const rect = svRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp01((clientX - rect.left) / rect.width);
    const y = clamp01((clientY - rect.top) / rect.height);
    updateHsv({
      s: Math.round(x * 100),
      v: Math.round((1 - y) * 100),
    });
  };

  const pickHue = (clientX: number) => {
    const rect = hueRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp01((clientX - rect.left) / rect.width);
    updateHsv({ h: Math.round(x * 360) });
  };

  const handleEyedropper = async () => {
    if (!eyeDropperSupported) return;
    try {
      const EyeDropperCtor = (
        window as unknown as {
          EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> };
        }
      ).EyeDropper;
      const result = await new EyeDropperCtor().open();
      commitHex(result.sRGBHex);
    } catch {
      /* cancelled */
    }
  };

  const svThumbLeft = `${hsv.s}%`;
  const svThumbTop = `${100 - hsv.v}%`;
  const hueThumbLeft = `${(hsv.h / 360) * 100}%`;
  const hueThumbColor = hsvToHex(hsv.h, 100, 100);

  return (
    <div className="color-picker-field" ref={rootRef}>
      <span className="color-picker-field__label">{label}</span>
      <div className="color-picker-field__control">
        <button
          type="button"
          className="color-picker-field__swatch-btn"
          style={{ backgroundColor: value }}
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls={popoverId}
          aria-label={`${label}: ${value}`}
        />
        <input
          type="text"
          className="color-picker-field__hex-input"
          value={hexInput}
          onChange={(e) => handleHexInputChange(e.target.value)}
          onBlur={() => commitHex(hexInput)}
          spellCheck={false}
        />
      </div>

      {open && (
        <div id={popoverId} className="color-picker-popover" role="dialog" aria-label={label}>
          <div className="color-picker-popover__tabs" role="tablist">
            <button type="button" className="color-picker-popover__tab is-active" role="tab" aria-selected>
              Сплошной цвет
            </button>
            <button
              type="button"
              className="color-picker-popover__tab"
              role="tab"
              aria-selected={false}
              disabled
              title="Градиенты пока недоступны"
            >
              Градиент
            </button>
          </div>

          <div
            ref={svRef}
            className="color-picker-popover__sv"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              pickSv(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                pickSv(e.clientX, e.clientY);
              }
            }}
            onPointerUp={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }}
          >
            <div
              className="color-picker-popover__sv-base"
              style={{ backgroundColor: hsvToHex(hsv.h, 100, 100) }}
            />
            <div className="color-picker-popover__sv-white" />
            <div className="color-picker-popover__sv-black" />
            <span
              className="color-picker-popover__sv-thumb"
              style={{ left: svThumbLeft, top: svThumbTop, backgroundColor: value }}
            />
          </div>

          <div
            ref={hueRef}
            className="color-picker-popover__hue"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              pickHue(e.clientX);
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                pickHue(e.clientX);
              }
            }}
            onPointerUp={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }}
          >
            <span
              className="color-picker-popover__hue-thumb"
              style={{ left: hueThumbLeft, backgroundColor: hueThumbColor }}
            />
          </div>

          <div className="color-picker-popover__hex-row">
            <span className="color-picker-popover__hex-preview" style={{ backgroundColor: value }} />
            <input
              type="text"
              className="color-picker-popover__hex-inline"
              value={hexInput}
              onChange={(e) => handleHexInputChange(e.target.value)}
              onBlur={() => commitHex(hexInput)}
              spellCheck={false}
            />
            <button
              type="button"
              className="color-picker-popover__eyedropper"
              onClick={handleEyedropper}
              disabled={!eyeDropperSupported}
              title={
                eyeDropperSupported
                  ? 'Пипетка'
                  : 'Пипетка недоступна в этом браузере'
              }
              aria-label="Пипетка"
            >
              <EyedropperIcon />
            </button>
          </div>

          <div className="color-picker-popover__palette">
            <span className="color-picker-popover__palette-label">Палитра</span>
            <div className="color-picker-popover__palette-grid" role="listbox" aria-label="Палитра цветов">
              {THEME_COLOR_PALETTE.map((color) => {
                const selected = normalizeHex(value) === normalizeHex(color);
                return (
                  <button
                    key={color}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`color-picker-popover__palette-swatch${selected ? ' is-selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => commitHex(color)}
                    title={normalizeHex(color)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
