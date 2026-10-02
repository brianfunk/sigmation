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
