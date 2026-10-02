import MathJax from 'mathjax';
import { normalizeInput, resolveOptions, SigmationError, type RenderOptions, type ResolvedOptions } from './options.js';

/** MathJax's default ex size at a 16px font. */
const PX_PER_EX = 8;

export interface Rendered {
  /** Standalone SVG document, sized in px, colored, with optional background rect. */
  svg: string;
  /** Presentation MathML. */
  mml: string;
  /** Width in px at the requested scale. */
  width: number;
  /** Height in px at the requested scale. */
  height: number;
  /** Options after defaults were applied. */
  options: ResolvedOptions;
}

type MJ = {
  startup: { adaptor: { serializeXML(node: unknown): string } };
  tex2svgPromise(input: string, opts: { display: boolean }): Promise<unknown>;
  asciimath2svgPromise(input: string, opts: { display: boolean }): Promise<unknown>;
  tex2mmlPromise(input: string, opts: { display: boolean }): Promise<string>;
  asciimath2mmlPromise(input: string, opts: { display: boolean }): Promise<string>;
};

let ready: Promise<MJ> | undefined;

/** Initialize MathJax once per process. Safe to call repeatedly. */
export function getMathJax(): Promise<MJ> {
  ready ??= (MathJax as unknown as { init(config: object): Promise<unknown> })
    .init({
      loader: { load: ['input/tex', 'input/asciimath', 'output/svg'] },
      tex: { packages: { '[-]': ['require', 'noundefined'] } },
      svg: { fontCache: 'none', linebreaks: { inline: false } },
      startup: { typeset: false },
    })
    .then(() => MathJax as unknown as MJ);
  return ready;
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const unescapeXml = (s: string) => s.replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m);

export const escapeXml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

function fmt(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}

/**
 * Render math to SVG and MathML. Pure apart from MathJax's one-time init.
 * Throws SigmationError for bad input (including TeX syntax errors).
 */
export async function render(input: unknown, opts: RenderOptions = {}, format: 'svg' | 'png' | 'mml' | 'html' | 'badge' = 'svg'): Promise<Rendered> {
  const math = normalizeInput(input);
  const options = resolveOptions(math, opts, format);
  const mj = await getMathJax();
  const display = !options.inline;

  const node = options.lang === 'tex'
    ? await mj.tex2svgPromise(math, { display })
    : await mj.asciimath2svgPromise(math, { display });
  let svg = mj.startup.adaptor.serializeXML(node);

  const err = svg.match(/data-mjx-error="([^"]*)"/);
  if (err) throw new SigmationError(`TeX error: ${unescapeXml(err[1] ?? '')}`);

  const mml = options.lang === 'tex'
    ? await mj.tex2mmlPromise(math, { display })
    : await mj.asciimath2mmlPromise(math, { display });

  // Unwrap <mjx-container> and size in px.
  svg = svg.replace(/^<mjx-container[^>]*>/, '').replace(/<\/mjx-container>$/, '');
  const dims = svg.match(/width="([\d.]+)ex" height="([\d.]+)ex"/);
  if (!dims || (svg.match(/<svg[\s>]/g) ?? []).length !== 1) {
    throw new SigmationError('Renderer produced unexpected output');
  }
  const width = parseFloat(dims[1]!) * PX_PER_EX * options.scale;
  const height = parseFloat(dims[2]!) * PX_PER_EX * options.scale;
  svg = svg.replace(/width="[\d.]+ex" height="[\d.]+ex"/, `width="${fmt(width)}" height="${fmt(height)}"`);
  svg = svg.replace(/ style="vertical-align: [^"]*"/, '');
  svg = svg.replace(/currentColor/g, options.color);

  // Background rect covering the viewBox, plus an accessible title.
  const vb = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/);
  const title = `<title>${escapeXml(math)}</title>`;
  const rect = options.bg !== 'transparent' && vb
    ? `<rect x="${vb[1]}" y="${vb[2]}" width="${vb[3]}" height="${vb[4]}" fill="${options.bg}"/>`
    : '';
  svg = svg.replace(/^<svg([^>]*)>/, (_m, attrs: string) => `<svg${attrs} aria-label="${escapeXml(math)}">${title}${rect}`);

  return { svg, mml, width, height, options };
}
