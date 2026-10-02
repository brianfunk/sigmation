import { escapeXml } from './render.js';
import type { Rendered } from './render.js';

/** Wrap a rendered equation in a minimal standalone HTML page. */
export function toHtml(input: string, rendered: Rendered): string {
  const dark = rendered.options.theme === 'dark';
  const pageBg = rendered.options.bg !== 'transparent' ? rendered.options.bg : dark ? '#111' : '#fff';
  const title = escapeXml(input);
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>Σ ${title}</title>` +
    `<style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:${pageBg}}svg{max-width:90vw;height:auto}</style>` +
    `</head><body>${rendered.svg}</body></html>`
  );
}
