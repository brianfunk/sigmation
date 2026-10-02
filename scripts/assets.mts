// Generates public/icon-*.png, apple-touch-icon.png and og.png from favicon.svg and the renderer.
// Run: npm run assets
import { writeFile } from 'node:fs/promises';
import { render, svgToPng } from '../src/core/index.js';

// Favicon: a MathJax Σ glyph (pure path, no font needed) on a green rounded square.
const sigma = await render('\\Sigma', { lang: 'tex', inline: true, color: '#ffffff' });
const sh = 40;
const sw = (sigma.width / sigma.height) * sh;
const glyph = sigma.svg
  .replace(/^<svg/, `<svg x="${(64 - sw) / 2}" y="${(64 - sh) / 2}"`)
  .replace(/width="[\d.]+" height="[\d.]+"/, `width="${sw}" height="${sh}"`)
  .replace(/<title>[^<]*<\/title>/, '');
const favicon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="#16a34a"/>${glyph}</svg>`;
await writeFile('public/favicon.svg', favicon);
console.log('wrote favicon.svg');
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]] as const) {
  await writeFile(`public/${name}`, await svgToPng(favicon, { width: size }));
  console.log('wrote', name);
}

// Open Graph card: 1200x630, white, with the title set in MathJax's sans font and a sample equation.
const W = 1200, H = 630;
const title = await render('\\textsf{Σigmation}', { lang: 'tex', inline: true, color: '#16a34a' });
const sub = await render('\\textsf{Math to SVG, PNG, MathML and badges}', { lang: 'tex', inline: true, color: '#57534e' });
const eq = await render('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', { lang: 'tex', color: '#1c1917' });
const place = (r: { svg: string; width: number; height: number }, x: number, y: number, h: number) => {
  const w = (r.width / r.height) * h;
  return r.svg.replace(/^<svg/, `<svg x="${x - w / 2}" y="${y}"`).replace(/width="[\d.]+" height="[\d.]+"/, `width="${w}" height="${h}"`);
};
const og =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
  `<rect width="${W}" height="${H}" fill="#ffffff"/><rect y="${H - 14}" width="${W}" height="14" fill="#16a34a"/>` +
  place(title, W / 2, 90, 96) + place(sub, W / 2, 215, 34) + place(eq, W / 2, 320, 210) +
  `</svg>`;
await writeFile('public/og.png', await svgToPng(og, { width: W }));
console.log('wrote og.png');
