import { initWasm, Resvg } from '@resvg/resvg-wasm';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SigmationError } from './options.js';

let ready: Promise<void> | undefined;

/** Load the resvg WASM once per process. */
export function getResvg(): Promise<void> {
  ready ??= (async () => {
    const url = import.meta.resolve('@resvg/resvg-wasm/index_bg.wasm');
    const bytes = await readFile(fileURLToPath(url));
    await initWasm(bytes);
  })();
  return ready;
}

export interface PngOptions {
  /** Exact output width in px. Beats `height` and the SVG's own size. */
  width?: number;
  /** Exact output height in px. */
  height?: number;
  /** Background color or `transparent` (default). */
  background?: string;
}

/** Rasterize an SVG string to PNG bytes. Sizes follow the SVG's width/height unless overridden. */
export async function svgToPng(svg: string, opts: PngOptions = {}): Promise<Uint8Array> {
  await getResvg();
  const fitTo = opts.width
    ? ({ mode: 'width', value: Math.round(opts.width) } as const)
    : opts.height
      ? ({ mode: 'height', value: Math.round(opts.height) } as const)
      : ({ mode: 'original' } as const);
  try {
    const resvg = new Resvg(svg, {
      fitTo,
      ...(opts.background && opts.background !== 'transparent' && { background: opts.background }),
    });
    return resvg.render().asPng();
  } catch (e) {
    throw new SigmationError(`PNG render failed: ${(e as Error).message}`);
  }
}
