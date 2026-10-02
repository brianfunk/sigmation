import { describe, expect, it } from 'vitest';
import { toBadge } from '../src/core/badge.js';
import { svgToPng } from '../src/core/png.js';

describe('badge', () => {
  it('renders a 20px-high pill with default label', async () => {
    const svg = await toBadge('E=mc^2');
    expect(svg).toContain('height="20"');
    expect(svg).toMatch(/^<svg[^>]* viewBox="0 0 \d+ 20"/);
    expect(svg).toContain('<title>Σ: E=mc^2</title>');
    expect(svg).toContain('fill="#4c1"');
    expect(svg).toContain('fill="#555"');
    expect(svg).not.toContain('<text');
  });

  it('honors label, badge color and escapes TeX specials in the label', async () => {
    const svg = await toBadge('x', { label: 'a_b & c', badgeColor: '007ec6' });
    expect(svg).toContain('<title>a_b &amp; c: x</title>');
    expect(svg).toContain('fill="#007ec6"');
  });

  it('maps color to ink and bg to the label field', async () => {
    const svg = await toBadge('x', { color: '#112233', bg: 'eeeeee' });
    expect(svg).toContain('fill="#eeeeee"');
    expect(svg).not.toContain('fill="#555"');
    expect(svg).toContain('#112233');
    expect(svg).not.toContain('#ffffff');
    const plain = await toBadge('x', { bg: 'transparent' });
    expect(plain).toContain('fill="#555"');
    expect(plain).toContain('#ffffff');
  });

  it('rasterizes cleanly', async () => {
    const png = await svgToPng(await toBadge('sum_(i=1)^N 2^i'));
    expect(png[0]).toBe(0x89);
  });

  it('rejects bad input', async () => {
    await expect(toBadge('')).rejects.toThrow(/Missing/);
  });
});
