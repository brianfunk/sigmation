import { describe, expect, it } from 'vitest';
import app from '../src/api/app.js';

const get = (path: string, headers: Record<string, string> = {}) => app.request(path, { headers });

describe('api', () => {
  it('serves svg with cache headers and CORS', async () => {
    const res = await get('/svg?m=x^2');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/svg+xml');
    expect(res.headers.get('cache-control')).toContain('immutable');
    expect(res.headers.get('etag')).toMatch(/^"/);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(await res.text()).toMatch(/^<svg/);
  });

  it('returns 304 on a matching ETag', async () => {
    const first = await get('/svg?m=x^2');
    const res = await get('/svg?m=x^2', { 'if-none-match': first.headers.get('etag')! });
    expect(res.status).toBe(304);
  });

  it('serves png, mml, html, badge', async () => {
    const png = await get('/png?m=x^2&scale=1');
    expect(png.headers.get('content-type')).toBe('image/png');
    expect(new Uint8Array(await png.arrayBuffer())[0]).toBe(0x89);

    const mml = await get('/mml?m=\\frac{a}{b}');
    expect(mml.headers.get('content-type')).toContain('mathml');
    expect(await mml.text()).toContain('<mfrac');

    const html = await get('/html?m=x&theme=dark');
    const page = await html.text();
    expect(page).toContain('<!doctype html>');
    expect(page).toMatch(/og:image" content="http:\/\/localhost\/png\?m=x/);

    const badge = await get('/badge?m=E=mc^2&label=physics');
    expect(await badge.text()).toContain('<title>physics: E=mc^2</title>');
  });

  it('accepts input aliases and option aliases', async () => {
    const res = await get('/svg?math=x&l=tex&c=ff0000');
    expect(await res.text()).toContain('#ff0000');
    const res2 = await get('/svg?s=x');
    expect(res2.status).toBe(200);
  });

  it('keeps the 2017 routes alive', async () => {
    expect((await get('/math.png?m=x')).headers.get('content-type')).toBe('image/png');
    expect((await get('/math.svg?m=x')).headers.get('content-type')).toContain('svg');
    expect((await get('/math?m=x', { accept: 'image/png' })).headers.get('content-type')).toBe('image/png');
    expect((await get('/math?m=x', { 'content-type': 'application/mathml+xml' })).headers.get('content-type')).toContain('mathml');
    expect((await get('/math?m=x')).headers.get('content-type')).toContain('svg');
  });

  it('mirrors routes under /api', async () => {
    expect((await get('/api/svg?m=x')).status).toBe(200);
    const health = await get('/api/health');
    expect(await health.json()).toMatchObject({ ok: true });
  });

  it('returns 400 JSON on bad input, not cached', async () => {
    const missing = await get('/svg');
    expect(missing.status).toBe(400);
    expect(missing.headers.get('cache-control')).toBe('no-store');
    expect(await missing.json()).toEqual({ error: 'Missing math input' });

    const bad = await get('/svg?m=\\frac{a');
    expect(bad.status).toBe(400);
    expect((await bad.json()).error).toContain('TeX error');

    const badOpt = await get('/png?m=x&scale=50');
    expect(badOpt.status).toBe(400);

    const long = await get(`/svg?m=${'x'.repeat(2100)}`);
    expect(long.status).toBe(400);
  });

  it('404s unknown routes with hints', async () => {
    const res = await get('/gif?m=x');
    expect(res.status).toBe(404);
    expect((await res.json()).routes).toContain('/png?m=...');
  });
});

describe('openapi', () => {
  it('serves a spec whose paths match the live routes', async () => {
    const res = await get('/openapi.json');
    expect(res.status).toBe(200);
    const spec = (await res.json()) as { openapi: string; paths: Record<string, unknown> };
    expect(spec.openapi).toBe('3.1.0');
    for (const p of ['/svg', '/png', '/badge', '/mml', '/html', '/math', '/math.{ext}', '/api/health', '/openapi.json']) {
      expect(spec.paths).toHaveProperty(p);
    }
    expect((await get('/api/openapi.json')).status).toBe(200);
  });
});
