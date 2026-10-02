import { escapeXml, render } from './render.js';
import { normalizeColor, resolveOptions, type RenderOptions } from './options.js';

const BADGE_H = 20;
const PAD = 6;
const CONTENT_H = 13;

/** Escape text for use inside a TeX \textsf{} group so labels render as glyph paths (no fonts needed). */
function texText(s: string): string {
  return s.replace(/[\\{}$&#^_%~]/g, (c) => (c === '\\' ? '\\textbackslash{}' : c === '~' ? '\\textasciitilde{}' : c === '^' ? '\\textasciicircum{}' : `\\${c}`));
}

/** Render an SVG with its own width/height, then inline it as a nested <svg> at a target height. */
function nest(svg: string, x: number, h: number): { markup: string; width: number } {
  const dims = svg.match(/width="([\d.]+)" height="([\d.]+)"/);
  const w0 = parseFloat(dims?.[1] ?? '0');
  const h0 = parseFloat(dims?.[2] ?? '1');
  const w = (w0 / h0) * h;
  const y = (BADGE_H - h) / 2;
  const inner = svg
    .replace(/^<svg/, `<svg x="${x.toFixed(2)}" y="${y.toFixed(2)}"`)
    .replace(/width="[\d.]+" height="[\d.]+"/, `width="${w.toFixed(2)}" height="${h.toFixed(2)}"`);
  return { markup: inner, width: w };
}

/**
 * Shields.io-style flat badge: label on the left, the equation on a colored field on the right.
 * Both halves are rendered by MathJax so the whole badge is pure paths.
 *
 * Option mapping for badges: `color` is the ink for both halves (default white),
 * `bg` is the label field (default #555), `badgeColor` is the equation field (default #4c1).
 */
export async function toBadge(input: unknown, opts: RenderOptions = {}): Promise<string> {
  const math = typeof input === 'string' ? input : '';
  const resolved = resolveOptions(math || 'x', opts, 'badge');
  const label = resolved.label;
  const ink = opts.color ? normalizeColor(opts.color) : '#ffffff';
  const labelBg = opts.bg && opts.bg.toLowerCase() !== 'transparent' ? normalizeColor(opts.bg, 'background') : '#555';

  const eq = await render(input, { ...opts, color: ink, bg: 'transparent', scale: 1, inline: true }, 'badge');
  const lbl = await render(`\\textsf{${texText(label)}}`, { lang: 'tex', color: ink, bg: 'transparent', scale: 1, inline: true }, 'badge');

  const labelPart = nest(lbl.svg, PAD, CONTENT_H * 0.78);
  const leftW = Math.round(labelPart.width + PAD * 2);
  const eqPart = nest(eq.svg, leftW + PAD, CONTENT_H);
  const rightW = Math.round(eqPart.width + PAD * 2);
  const totalW = leftW + rightW;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${BADGE_H}" viewBox="0 0 ${totalW} ${BADGE_H}" role="img" aria-label="${escapeXml(label)}: ${escapeXml(math)}">` +
    `<title>${escapeXml(label)}: ${escapeXml(math)}</title>` +
    `<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>` +
    `<clipPath id="r"><rect width="${totalW}" height="${BADGE_H}" rx="3" fill="#fff"/></clipPath>` +
    `<g clip-path="url(#r)">` +
    `<rect width="${leftW}" height="${BADGE_H}" fill="${labelBg}"/>` +
    `<rect x="${leftW}" width="${rightW}" height="${BADGE_H}" fill="${resolved.badgeColor}"/>` +
    `<rect width="${totalW}" height="${BADGE_H}" fill="url(#s)"/>` +
    `</g>` +
    labelPart.markup +
    eqPart.markup +
    `</svg>`
  );
}
