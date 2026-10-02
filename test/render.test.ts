import { describe, expect, it } from 'vitest';
import { render } from '../src/core/render.js';
import { SigmationError } from '../src/core/options.js';

const SUM_ASCII = 'sum_(i=1)^N 2^i';
const SUM_TEX = '\\sum_{i=1}^N 2^i';

describe('render', () => {
  it('renders AsciiMath to a standalone SVG sized in px', async () => {
    const r = await render(SUM_ASCII);
    expect(r.svg.startsWith('<svg')).toBe(true);
    expect(r.svg).not.toContain('mjx-container');
    expect(r.svg).not.toContain('ex"');
    expect(r.svg).toContain(`width="${r.width}"`);
    expect(r.width).toBeGreaterThan(20);
    expect(r.height).toBeGreaterThan(20);
    expect(r.svg).toContain('<title>sum_(i=1)^N 2^i</title>');
    expect(r.svg).toMatchSnapshot();
  });

  it('renders TeX and MathML', async () => {
    const r = await render(SUM_TEX);
    expect(r.options.lang).toBe('tex');
    expect(r.mml).toContain('<munderover');
    expect(r.mml).toMatchSnapshot();
  });

  it('AsciiMath and TeX agree on structure', async () => {
    const a = await render(SUM_ASCII);
    const t = await render(SUM_TEX);
    expect(a.mml).toContain('<munderover');
    expect(t.mml).toContain('<munderover');
  });

  it('scale multiplies the px size', async () => {
    const one = await render('x^2', { scale: 1 });
    const three = await render('x^2', { scale: 3 });
    expect(three.width / one.width).toBeCloseTo(3, 5);
  });

  it('applies color, dark theme, and background', async () => {
    const r = await render('x', { color: 'ff6600', bg: '#123456' });
    expect(r.svg).not.toContain('currentColor');
    expect(r.svg).toContain('fill="#ff6600"');
    expect(r.svg).toContain('<rect');
    expect(r.svg).toContain('fill="#123456"');
    const d = await render('x', { theme: 'dark' });
    expect(d.svg).toContain('#ffffff');
    expect(d.svg).not.toContain('<rect');
  });

  it('inline vs display changes the MathML display attribute', async () => {
    const d = await render('\\sum x', { lang: 'tex' });
    const i = await render('\\sum x', { lang: 'tex', inline: true });
    expect(d.mml).toContain('display="block"');
    expect(i.mml).not.toContain('display="block"');
  });

  it('escapes the input in title and aria-label', async () => {
    const r = await render('a<b');
    expect(r.svg).toContain('<title>a&lt;b</title>');
    expect(r.svg).toContain('aria-label="a&lt;b"');
  });

  it('throws SigmationError on TeX syntax errors', async () => {
    await expect(render('\\frac{a')).rejects.toThrow(SigmationError);
    await expect(render('\\frac{a')).rejects.toThrow(/Missing close brace/);
  });

  it('blocks \\require', async () => {
    await expect(render('\\require{physics}')).rejects.toThrow(SigmationError);
  });

  it('rejects empty and oversized input', async () => {
    await expect(render('')).rejects.toThrow(/Missing/);
    await expect(render('x'.repeat(3000))).rejects.toThrow(/too long/);
  });
});

describe('undefined macros', () => {
  it('report as errors instead of rendering red text', async () => {
    await expect(render('\\nope{x}')).rejects.toThrow(/Undefined control sequence/);
  });
});

describe('inline output', () => {
  it('is a single svg element even for inline math with operators', async () => {
    const r = await render('E=mc^2', { inline: true });
    expect((r.svg.match(/<svg[\s>]/g) ?? []).length).toBe(1);
    expect(r.svg).toMatch(/<\/svg>$/);
  });
});
