import { describe, expect, it } from 'vitest';
import { toPng } from '../src/core/index.js';
import { svgToPng } from '../src/core/png.js';

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

function size(png: Uint8Array): { w: number; h: number } {
  const dv = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { w: dv.getUint32(16), h: dv.getUint32(20) };
}

describe('png', () => {
  it('produces a PNG at the default 2x scale', async () => {
    const png = await toPng('x^2');
    expect(Array.from(png.slice(0, 4))).toEqual(PNG_MAGIC);
    const { w, h } = size(png);
    expect(w).toBeGreaterThan(10);
    expect(h).toBeGreaterThan(10);
  });

  it('scale changes the pixel size', async () => {
    const a = size(await toPng('x^2', { scale: 1 }));
    const b = size(await toPng('x^2', { scale: 4 }));
    expect(b.w / a.w).toBeGreaterThan(3.5);
  });

  it('width override wins', async () => {
    const { w } = size(await toPng('x^2', { width: 300 }));
    expect(w).toBe(300);
  });

  it('height override works', async () => {
    const { h } = size(await toPng('x^2', { height: 64 }));
    expect(h).toBe(64);
  });

  it('rejects invalid svg', async () => {
    await expect(svgToPng('<not svg')).rejects.toThrow(/PNG render failed/);
  });
});

describe('png transparency', () => {
  // Decode through resvg's own rasterizer to inspect alpha without a PNG decoder dependency.
  async function pixels(opts: object) {
    const { Resvg } = await import('@resvg/resvg-wasm');
    const { getResvg } = await import('../src/core/png.js');
    const { toSvg } = await import('../src/core/index.js');
    await getResvg();
    return new Resvg(await toSvg('x^2', opts)).render().pixels;
  }

  it('is fully transparent when no background is set', async () => {
    const px = await pixels({});
    expect(px[3]).toBe(0); // top-left alpha
    let transparent = 0;
    for (let i = 3; i < px.length; i += 4) if (px[i] === 0) transparent++;
    expect(transparent).toBeGreaterThan(px.length / 4 / 2);
  });

  it('stays transparent with theme=dark and bg=transparent', async () => {
    expect((await pixels({ theme: 'dark' }))[3]).toBe(0);
    expect((await pixels({ bg: 'transparent' }))[3]).toBe(0);
  });

  it('fills every pixel when a background is set', async () => {
    const px = await pixels({ bg: 'ff0000' });
    expect(Array.from(px.slice(0, 4))).toEqual([255, 0, 0, 255]);
    for (let i = 3; i < px.length; i += 4) expect(px[i]).toBe(255);
  });
});
