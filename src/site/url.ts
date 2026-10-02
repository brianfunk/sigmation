export type Format = 'svg' | 'png' | 'mml' | 'html' | 'badge';
export type Lang = 'auto' | 'tex' | 'ascii';

export interface Params {
  math: string;
  lang: Lang;
  format: Format;
  theme: 'light' | 'dark';
  color: string;
  bg: string;
  scale: number;
  inline: boolean;
  label: string;
  badgeColor: string;
}

export const DEFAULTS: Params = {
  math: 'sum_(i=1)^N 2^i',
  lang: 'auto',
  format: 'svg',
  theme: 'light',
  color: '',
  bg: '',
  scale: 1,
  inline: false,
  label: '',
  badgeColor: '',
};

const hex = (v: string) => v.replace(/^#/, '');

/** Build the API path, including only parameters that differ from the defaults. */
export function buildPath(p: Params): string {
  const q = new URLSearchParams();
  q.set('m', p.math.trim());
  if (p.lang !== 'auto') q.set('l', p.lang);
  if (p.theme === 'dark') q.set('theme', 'dark');
  if (p.color) q.set('color', hex(p.color));
  if (p.bg) q.set('bg', hex(p.bg));
  if (p.scale !== 1 && p.format !== 'badge') q.set('scale', String(p.scale));
  if (p.inline && p.format !== 'badge') q.set('inline', '1');
  if (p.format === 'badge') {
    if (p.label) q.set('label', p.label);
    if (p.badgeColor) q.set('badgeColor', hex(p.badgeColor));
  }
  // Keep the URL readable: URLSearchParams escapes more than browsers need.
  const qs = q.toString().replace(/%5C/gi, '\\').replace(/%7B/gi, '{').replace(/%7D/gi, '}').replace(/%5E/gi, '^').replace(/%28/gi, '(').replace(/%29/gi, ')').replace(/%2C/gi, ',').replace(/%3D/gi, '=').replace(/%2F/gi, '/');
  return `/${p.format}?${qs}`;
}

export function origin(): string {
  if (typeof window === 'undefined') return 'https://sigmations.netlify.app';
  const o = window.location.origin;
  return o.includes('localhost') ? o : 'https://sigmations.netlify.app';
}

const SHORT: Array<[keyof Params, string]> = [
  ['math', 'm'], ['lang', 'l'], ['format', 'f'], ['theme', 't'], ['color', 'c'], ['bg', 'bg'], ['scale', 's'], ['inline', 'i'], ['label', 'lb'], ['badgeColor', 'bc'],
];

/** Serialize non-default playground state into a hash fragment, so the page URL is shareable. */
export function encodeState(p: Params): string {
  const q = new URLSearchParams();
  for (const [key, short] of SHORT) {
    const v = p[key];
    if (v === DEFAULTS[key]) continue;
    q.set(short, typeof v === 'boolean' ? '1' : String(v));
  }
  const s = q.toString();
  return s ? `#${s}` : '';
}

/** Parse a hash fragment back into playground state, ignoring anything malformed. */
export function decodeState(hash: string): Params {
  const p: Params = { ...DEFAULTS };
  if (!hash || hash.length < 2) return p;
  const q = new URLSearchParams(hash.slice(1));
  for (const [key, short] of SHORT) {
    const v = q.get(short);
    if (v === null) continue;
    if (key === 'inline') p.inline = v === '1';
    else if (key === 'scale') { const n = Number(v); if (Number.isFinite(n) && n >= 0.25 && n <= 8) p.scale = n; }
    else if (key === 'lang') { if (v === 'auto' || v === 'tex' || v === 'ascii') p.lang = v; }
    else if (key === 'format') { if (['svg', 'png', 'mml', 'html', 'badge'].includes(v)) p.format = v as Format; }
    else if (key === 'theme') { if (v === 'light' || v === 'dark') p.theme = v; }
    else p[key] = v.slice(0, key === 'math' ? 2000 : 40);
  }
  return p;
}
