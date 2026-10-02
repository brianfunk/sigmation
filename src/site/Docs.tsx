const BASE = 'https://sigmations.netlify.app';

const PARAMS: Array<[string, string, string]> = [
  ['m', 'the math (aliases: math, input, s)', 'required'],
  ['l', 'tex or ascii', 'auto-detect'],
  ['theme', 'light or dark (sets the ink color)', 'light'],
  ['color', 'hex ink color', '000000'],
  ['bg', 'hex background or transparent', 'transparent'],
  ['scale', 'size multiplier, 0.25 to 8', '1 (png: 2)'],
  ['inline', '1 for text-style instead of display-style', '0'],
  ['w / h', 'exact width / height in px (png only)', ''],
  ['label', 'badge label (badge only)', 'Σ'],
  ['badgeColor', 'badge right-side hex (badge only)', '4c1'],
];

export default function Docs() {
  return (
    <section className="docs" id="docs">
      <h2>API</h2>
      <p>
        Every endpoint is a <code>GET</code> that returns the rendered math. Responses are immutable and cached for a year, so hotlinking is
        cheap. Bad input returns a JSON <code>400</code> with an <code>error</code> message.
      </p>
      <table>
        <thead>
          <tr>
            <th>Route</th>
            <th>Returns</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>/svg?m=…</code>
            </td>
            <td>image/svg+xml</td>
          </tr>
          <tr>
            <td>
              <code>/png?m=…</code>
            </td>
            <td>image/png</td>
          </tr>
          <tr>
            <td>
              <code>/badge?m=…&amp;label=…</code>
            </td>
            <td>shields-style SVG badge</td>
          </tr>
          <tr>
            <td>
              <code>/mml?m=…</code>
            </td>
            <td>application/mathml+xml</td>
          </tr>
          <tr>
            <td>
              <code>/html?m=…</code>
            </td>
            <td>standalone HTML page</td>
          </tr>
        </tbody>
      </table>

      <h3>Parameters</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Meaning</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {PARAMS.map(([n, d, def]) => (
            <tr key={n}>
              <td>
                <code>{n}</code>
              </td>
              <td>{d}</td>
              <td>{def}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>README badge</h3>
      <p>Drop an equation into a badge. Both halves are vector paths, so it stays crisp anywhere shields.io badges work.</p>
      <pre>
        <code>{`![physics](${BASE}/badge?m=E=mc^2&label=physics)`}</code>
      </pre>
      <p>
        <img src="/badge?m=E=mc^2&label=physics" alt="physics: E=mc^2" height={20} />{' '}
        <img src="/badge?m=sum_(i=1)^N 2^i&label=math&badgeColor=007ec6" alt="math: sum" height={20} />
      </p>

      <h2>npm</h2>
      <pre>
        <code>{`npm install sigmation

import { render, toPng, toBadge } from 'sigmation';

const { svg, mml } = await render('sum_(i=1)^N 2^i');
const png = await toPng('\\\\frac{a}{b}', { theme: 'dark', scale: 3 });
const badge = await toBadge('E=mc^2', { label: 'physics' });`}</code>
      </pre>

      <h2>CLI</h2>
      <pre>
        <code>{`npx sigmation 'sum_(i=1)^N 2^i' > sum.svg
npx sigmation '\\\\frac{a}{b}' -o frac.png --scale 3 --theme dark
echo 'E=mc^2' | npx sigmation -f badge --label physics > badge.svg`}</code>
      </pre>

      <h2>GitHub Action</h2>
      <p>Render equations into your repo at build time instead of hotlinking.</p>
      <pre>
        <code>{`- uses: brianfunk/sigmation/action@v1
  with:
    math: 'sum_(i=1)^N 2^i'
    out: docs/sum.svg
    theme: dark`}</code>
      </pre>
    </section>
  );
}
