/*

 ______ _                       _   _
 \  ___|_)                     | | (_)
  \ \   _  __ _ _ __ ___   __ _| |_ _  ___  _ __
   > > | |/ _` | '_ ` _ \ / _` | __| |/ _ \| '_ \
  / /__| | (_| | | | | | | (_| | |_| | (_) | | | |
 /_____)_|\__, |_| |_| |_|\__,_|\__|_|\___/|_| |_|
           __/ |
          |___/

  Σigmation — render math (AsciiMath, TeX) to SVG, PNG, MathML, HTML and badges.

*/

import { render, type Rendered } from './render.js';
import { svgToPng } from './png.js';
import { toBadge } from './badge.js';
import { toHtml, type HtmlOptions } from './html.js';
import { CONTENT_TYPES, normalizeInput, type Format, type RenderOptions } from './options.js';

export { render, svgToPng, toBadge, toHtml };
export type { HtmlOptions };
export type { Rendered };
export {
  CONTENT_TYPES,
  FORMATS,
  MAX_INPUT_LENGTH,
  SigmationError,
  detectLang,
  normalizeFormat,
  normalizeLang,
  optionsFromRaw,
  resolveOptions,
} from './options.js';
export type { Format, Lang, RawOptions, RenderOptions, ResolvedOptions, Theme } from './options.js';

export interface Output {
  body: string | Uint8Array;
  contentType: string;
  format: Format;
}

/** Render math straight to PNG bytes. */
export async function toPng(input: unknown, opts: RenderOptions = {}): Promise<Uint8Array> {
  const r = await render(input, opts, 'png');
  return svgToPng(r.svg, { width: r.options.width, height: r.options.height, background: r.options.bg });
}

/** Render math straight to a standalone SVG document. */
export async function toSvg(input: unknown, opts: RenderOptions = {}): Promise<string> {
  return (await render(input, opts, 'svg')).svg;
}

/** Render math straight to presentation MathML. */
export async function toMml(input: unknown, opts: RenderOptions = {}): Promise<string> {
  return (await render(input, opts, 'mml')).mml;
}

/** One call for every format. Used by the CLI and the API. */
export async function sigmation(input: unknown, format: Format = 'svg', opts: RenderOptions = {}, html: HtmlOptions = {}): Promise<Output> {
  const contentType = CONTENT_TYPES[format];
  switch (format) {
    case 'png':
      return { body: await toPng(input, opts), contentType, format };
    case 'badge':
      return { body: await toBadge(input, opts), contentType, format };
    case 'html': {
      const r = await render(input, opts, 'html');
      return { body: toHtml(normalizeInput(input), r, html), contentType, format };
    }
    case 'mml':
      return { body: await toMml(input, opts), contentType, format };
    default:
      return { body: await toSvg(input, opts), contentType, format };
  }
}

export default sigmation;
