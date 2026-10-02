import { describe, expect, it } from 'vitest';
import {
  MAX_INPUT_LENGTH,
  SigmationError,
  detectLang,
  normalizeColor,
  normalizeFormat,
  normalizeInput,
  normalizeLang,
  optionsFromRaw,
  resolveOptions,
} from '../src/core/options.js';

describe('detectLang', () => {
  it('treats a leading backslash or dollar as TeX', () => {
    expect(detectLang('\\frac{a}{b}')).toBe('tex');
    expect(detectLang('  $x^2$')).toBe('tex');
  });
  it('defaults to AsciiMath', () => {
    expect(detectLang('sum_(i=1)^N 2^i')).toBe('ascii');
  });
});

describe('normalizeLang / normalizeFormat', () => {
  it('accepts aliases', () => {
    expect(normalizeLang('t')).toBe('tex');
    expect(normalizeLang('latex')).toBe('tex');
    expect(normalizeLang('a')).toBe('ascii');
    expect(normalizeLang(undefined)).toBe('auto');
    expect(normalizeFormat('.png')).toBe('png');
    expect(normalizeFormat('mathml')).toBe('mml');
    expect(normalizeFormat(undefined)).toBe('svg');
  });
  it('rejects unknown values', () => {
    expect(() => normalizeLang('klingon')).toThrow(SigmationError);
    expect(() => normalizeFormat('gif')).toThrow(SigmationError);
  });
});

describe('normalizeColor', () => {
  it('normalizes hex and transparent', () => {
    expect(normalizeColor('FF6600')).toBe('#ff6600');
    expect(normalizeColor('#abc')).toBe('#abc');
    expect(normalizeColor('Transparent')).toBe('transparent');
  });
  it('rejects garbage', () => {
    expect(() => normalizeColor('red')).toThrow(/Invalid color/);
    expect(() => normalizeColor('#12345')).toThrow(SigmationError);
  });
});

describe('normalizeInput', () => {
  it('trims and validates', () => {
    expect(normalizeInput('  x^2 ')).toBe('x^2');
    expect(() => normalizeInput('')).toThrow(/Missing/);
    expect(() => normalizeInput(undefined)).toThrow(/Missing/);
    expect(() => normalizeInput('x'.repeat(MAX_INPUT_LENGTH + 1))).toThrow(/too long/);
  });
});

describe('optionsFromRaw', () => {
  it('maps query-style aliases', () => {
    const o = optionsFromRaw({ l: 'tex', i: '1', c: 'fff', bg: '000', scale: '3', w: '200', label: 'eq' });
    expect(o).toEqual({ lang: 'tex', inline: true, color: 'fff', bg: '000', scale: 3, width: 200, height: undefined, label: 'eq' });
  });
  it('validates numbers and theme', () => {
    expect(() => optionsFromRaw({ scale: '99' })).toThrow(/scale/);
    expect(() => optionsFromRaw({ w: 'abc' })).toThrow(/width/);
    expect(() => optionsFromRaw({ theme: 'blue' })).toThrow(/theme/);
  });
});

describe('resolveOptions', () => {
  it('applies defaults per format', () => {
    expect(resolveOptions('x', {}, 'svg').scale).toBe(1);
    expect(resolveOptions('x', {}, 'png').scale).toBe(2);
    expect(resolveOptions('x', {}).color).toBe('#000000');
    expect(resolveOptions('x', { theme: 'dark' }).color).toBe('#ffffff');
    expect(resolveOptions('x', { theme: 'dark', color: '#f00' }).color).toBe('#f00');
    expect(resolveOptions('\\alpha', {}).lang).toBe('tex');
    expect(resolveOptions('\\alpha', { lang: 'ascii' }).lang).toBe('ascii');
  });
});
