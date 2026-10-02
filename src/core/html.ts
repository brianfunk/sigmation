import { escapeXml } from './render.js';
import type { Rendered } from './render.js';

export interface HtmlOptions {
  /** Absolute origin (e.g. https://sigmation.dev). When given, the page gets Open Graph tags with a PNG of the equation. */
  baseUrl?: string;
}

/** Build the PNG URL that social cards should unfurl: same math and colors, solid background, 4x. */
export function ogImageUrl(baseUrl: string, input: string, rendered: Rendered): string {
  const o = rendered.options;
  const q = new URLSearchParams({ m: input, l: o.lang, scale: '4' });
  q.set('color', o.color.slice(1));
  q.set('bg', o.bg !== 'transparent' ? o.bg.slice(1) : o.theme === 'dark' ? '111111' : 'ffffff');
  if (o.inline) q.set('inline', '1');
  return `${baseUrl.replace(/\/$/, '')}/png?${q.toString()}`;
}

/** Wrap a rendered equation in a minimal standalone HTML page. */
export function toHtml(input: string, rendered: Rendered, html: HtmlOptions = {}): string {
  const dark = rendered.options.theme === 'dark';
  const pageBg = rendered.options.bg !== 'transparent' ? rendered.options.bg : dark ? '#111' : '#fff';
  const title = escapeXml(input);
  const og = html.baseUrl
    ? `<meta property="og:type" content="website"><meta property="og:site_name" content="Σigmation">` +
      `<meta property="og:title" content="${title}"><meta property="og:description" content="Rendered with Σigmation">` +
      `<meta property="og:image" content="${escapeXml(ogImageUrl(html.baseUrl, input, rendered))}"><meta property="og:image:alt" content="${title}">` +
      `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}">` +
      `<meta name="twitter:image" content="${escapeXml(ogImageUrl(html.baseUrl, input, rendered))}">`
    : '';
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>Σ ${title}</title>${og}` +
    `<style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:${pageBg}}svg{max-width:90vw;height:auto}</style>` +
    `</head><body>${rendered.svg}</body></html>`
  );
}
