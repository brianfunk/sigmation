/*

 ______ _                       _   _
 \  ___|_)                     | | (_)
  \ \   _  __ _ _ __ ___   __ _| |_ _  ___  _ __
   > > | |/ _` | '_ ` _ \ / _` | __| |/ _ \| '_ \
  / /__| | (_| | | | | | | (_| | |_| | (_) | | | |
 /_____)_|\__, |_| |_| |_|\__,_|\__|_|\___/|_| |_|
           __/ |
          |___/

*/

export type Lang = 'tex' | 'ascii';
export type Format = 'svg' | 'png' | 'mml' | 'html' | 'badge';
export type Theme = 'light' | 'dark';

/** Options accepted by every surface (library, CLI, API). All optional. */
export interface RenderOptions {
  /** Input language. Defaults to auto-detect (`\` or `$` means TeX). */
  lang?: Lang | 'auto';
  /** Inline (text-style) math instead of display-style. Default false. */
  inline?: boolean;
  /** Foreground color, hex. Default `#000000` (or `#ffffff` with `theme: 'dark'`). */
  color?: string;
  /** Background color, hex, or `transparent` (default). */
  bg?: string;
  /** Shorthand that picks a default `color`. Explicit `color` wins. */
  theme?: Theme;
  /** Size multiplier, 0.25 to 8. Default 1 (SVG) or 2 (PNG). */
  scale?: number;
  /** Target width in px (PNG only). Overrides `scale`. */
  width?: number;
  /** Target height in px (PNG only). Overrides `scale`. */
  height?: number;
  /** Badge label (badge format only). Default `Σ`. */
  label?: string;
  /** Badge right-side color (badge format only). Default `#4c1`. */
  badgeColor?: string;
}

export interface ResolvedOptions {
  lang: Lang;
  inline: boolean;
  color: string;
  bg: string;
  theme: Theme;
  scale: number;
  width?: number;
  height?: number;
  label: string;
  badgeColor: string;
}

export const MAX_INPUT_LENGTH = 2000;
export const FORMATS: readonly Format[] = ['svg', 'png', 'mml', 'html', 'badge'];

export const CONTENT_TYPES: Record<Format, string> = {
  svg: 'image/svg+xml; charset=utf-8',
  png: 'image/png',
  mml: 'application/mathml+xml; charset=utf-8',
  html: 'text/html; charset=utf-8',
  badge: 'image/svg+xml; charset=utf-8',
};

/** Thrown for anything the caller got wrong. Maps to HTTP 400. */
export class SigmationError extends Error {
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = 'SigmationError';
  }
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Normalize a color string. Accepts hex with or without `#`, or `transparent`. */
export function normalizeColor(value: string, what = 'color'): string {
  const v = value.trim();
  if (v.toLowerCase() === 'transparent') return 'transparent';
  if (HEX_RE.test(v)) return `#${v.replace(/^#/, '').toLowerCase()}`;
  throw new SigmationError(`Invalid ${what} "${value}": use hex like #ff6600 or "transparent"`);
}

/** Guess the input language: TeX if it starts with a backslash or dollar sign, else AsciiMath. */
export function detectLang(input: string): Lang {
  const s = input.trimStart();
  return s.startsWith('\\') || s.startsWith('$') ? 'tex' : 'ascii';
}

export function normalizeLang(value: string | undefined): Lang | 'auto' {
  if (value === undefined || value === '') return 'auto';
  const v = value.toLowerCase();
  if (['tex', 'latex', 't', 'l'].includes(v)) return 'tex';
  if (['ascii', 'asciimath', 'am', 'a'].includes(v)) return 'ascii';
  if (v === 'auto') return 'auto';
  throw new SigmationError(`Invalid lang "${value}": use "tex" or "ascii"`);
}

export function normalizeFormat(value: string | undefined): Format {
  if (value === undefined || value === '') return 'svg';
  const v = value.toLowerCase().replace(/^\./, '');
  if ((FORMATS as string[]).includes(v)) return v as Format;
  if (v === 'mathml') return 'mml';
  throw new SigmationError(`Invalid format "${value}": use one of ${FORMATS.join(', ')}`);
}

function toBool(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (value === undefined) return false;
  return ['1', 'true', 'yes', 'on', ''].includes(value.toLowerCase());
}

function toNumber(value: string | number | undefined, what: string, min: number, max: number): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new SigmationError(`Invalid ${what} "${value}": must be a number between ${min} and ${max}`);
  }
  return n;
}

/** Validate the math input itself. */
export function normalizeInput(input: unknown): string {
  if (typeof input !== 'string') throw new SigmationError('Missing math input');
  const s = input.trim();
  if (!s) throw new SigmationError('Missing math input');
  if (s.length > MAX_INPUT_LENGTH) {
    throw new SigmationError(`Input too long: ${s.length} chars, max ${MAX_INPUT_LENGTH}`);
  }
  return s;
}

/** Raw, string-valued options as they arrive from a query string or CLI flags. */
export type RawOptions = Partial<Record<string, string | undefined>>;

/** Pick the first defined alias from a raw map. */
export function pick(raw: RawOptions, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = raw[k];
    if (v !== undefined) return v;
  }
  return undefined;
}

/** Convert raw string params (query/CLI) into typed RenderOptions. Throws SigmationError on bad values. */
export function optionsFromRaw(raw: RawOptions): RenderOptions {
  const theme = pick(raw, 'theme');
  if (theme !== undefined && theme !== 'light' && theme !== 'dark') {
    throw new SigmationError(`Invalid theme "${theme}": use "light" or "dark"`);
  }
  const inlineRaw = pick(raw, 'inline', 'i');
  const color = pick(raw, 'color', 'c', 'fg');
  const bg = pick(raw, 'bg', 'background');
  const label = pick(raw, 'label');
  const badgeColor = pick(raw, 'badgeColor', 'badge_color', 'bc');
  return {
    lang: normalizeLang(pick(raw, 'lang', 'l')),
    ...(inlineRaw !== undefined && { inline: toBool(inlineRaw) }),
    ...(color !== undefined && { color }),
    ...(bg !== undefined && { bg }),
    ...(theme !== undefined && { theme }),
    scale: toNumber(pick(raw, 'scale', 'zoom', 'x'), 'scale', 0.25, 8),
    width: toNumber(pick(raw, 'width', 'w'), 'width', 1, 4096),
    height: toNumber(pick(raw, 'height', 'h'), 'height', 1, 4096),
    ...(label !== undefined && { label }),
    ...(badgeColor !== undefined && { badgeColor }),
  };
}

/** Fill defaults and validate. `format` decides the default scale. */
export function resolveOptions(input: string, opts: RenderOptions = {}, format: Format = 'svg'): ResolvedOptions {
  const theme: Theme = opts.theme ?? 'light';
  const lang = !opts.lang || opts.lang === 'auto' ? detectLang(input) : opts.lang;
  const color = normalizeColor(opts.color ?? (theme === 'dark' ? '#ffffff' : '#000000'));
  const bg = normalizeColor(opts.bg ?? 'transparent', 'background');
  const scale = opts.scale ?? (format === 'png' ? 2 : 1);
  if (!Number.isFinite(scale) || scale < 0.25 || scale > 8) {
    throw new SigmationError(`Invalid scale ${scale}: must be between 0.25 and 8`);
  }
  return {
    lang,
    inline: opts.inline ?? false,
    color,
    bg,
    theme,
    scale,
    width: opts.width,
    height: opts.height,
    label: opts.label ?? 'Σ',
    badgeColor: normalizeColor(opts.badgeColor ?? '#4c1', 'badge color'),
  };
}
