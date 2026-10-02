import { useId } from 'react';

/** Expand 3/4/6/8-digit hex (with or without #) to #rrggbb for the native picker; null if not parseable. */
function toRgb(hex: string): string | null {
  const h = hex.replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3,4}$/.test(h)) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  if (/^[0-9a-f]{6}([0-9a-f]{2})?$/.test(h)) return `#${h.slice(0, 6)}`;
  return null;
}

interface Props {
  label: string;
  /** Hex without #, or '' for "unset" (theme default / transparent). */
  value: string;
  /** What '' means, shown as placeholder and used as the picker's starting color. */
  fallback: string;
  fallbackLabel: string;
  onChange: (hex: string) => void;
}

export default function ColorField({ label, value, fallback, fallbackLabel, onChange }: Props) {
  const id = useId();
  const rgb = toRgb(value) ?? toRgb(fallback) ?? '#000000';
  const unset = value === '';
  const transparent = unset && fallbackLabel === 'transparent';
  return (
    <div className="colorfield">
      <label htmlFor={id}>{label}</label>
      <div className={`swatchrow ${transparent ? 'transparent' : ''}`}>
        <span className="swatch" title={unset ? fallbackLabel : `#${value.replace(/^#/, '')}`}>
          <input type="color" value={rgb} aria-label={`${label} picker`} onChange={(e) => onChange(e.target.value.slice(1))} />
        </span>
        <input
          id={id}
          type="text"
          value={value}
          placeholder={fallbackLabel}
          onChange={(e) => onChange(e.target.value.replace(/^#/, ''))}
          maxLength={8}
          spellCheck={false}
        />
        {!unset && (
          <button type="button" className="clear" onClick={() => onChange('')} title={`Reset to ${fallbackLabel}`} aria-label={`Reset ${label} to ${fallbackLabel}`}>
            ×
          </button>
        )}
      </div>
    </div>
  );
}
