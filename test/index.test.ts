import { describe, expect, it } from 'vitest';
import sigmation, { toHtml, toMml, toSvg, render } from '../src/core/index.js';

describe('sigmation()', () => {
  it('dispatches every format with the right content type', async () => {
    const svg = await sigmation('x^2', 'svg');
    expect(svg.contentType).toContain('image/svg+xml');
    expect(String(svg.body)).toMatch(/^<svg/);

    const png = await sigmation('x^2', 'png');
    expect(png.contentType).toBe('image/png');
    expect(png.body).toBeInstanceOf(Uint8Array);

    const mml = await sigmation('x^2', 'mml');
    expect(mml.contentType).toContain('mathml');
    expect(String(mml.body)).toMatch(/^<math/);

    const html = await sigmation('x^2', 'html');
    expect(html.contentType).toContain('text/html');
    expect(String(html.body)).toMatch(/^<!doctype html>/);
    expect(String(html.body)).toContain('<svg');

    const badge = await sigmation('x^2', 'badge', { label: 'eq' });
    expect(badge.contentType).toContain('image/svg+xml');
    expect(String(badge.body)).toContain('<title>eq: x^2</title>');
  });

  it('exposes the convenience helpers', async () => {
    expect(await toSvg('x')).toMatch(/^<svg/);
    expect(await toMml('x')).toMatch(/^<math/);
    const r = await render('x', { theme: 'dark' });
    expect(toHtml('x', r)).toContain('background:#111');
    const l = await render('x', { bg: '#eee' });
    expect(toHtml('x', l)).toContain('background:#eee');
    expect(toHtml('x', l)).not.toContain('og:image');
    const withOg = toHtml('a<b', r, { baseUrl: 'https://example.test/' });
    expect(withOg).toContain('property="og:image" content="https://example.test/png?m=a%3Cb&amp;l=ascii&amp;scale=4&amp;color=ffffff&amp;bg=111111"');
    expect(withOg).toContain('<meta property="og:title" content="a&lt;b">');
  });
});
