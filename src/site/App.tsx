import { useEffect, useMemo, useState } from 'react';
import { EXAMPLES } from './examples';
import { DEFAULTS, buildPath, origin, type Format, type Params } from './url';
import Docs from './Docs';

const FORMATS: Array<{ id: Format; name: string }> = [
  { id: 'svg', name: 'SVG' },
  { id: 'png', name: 'PNG' },
  { id: 'badge', name: 'Badge' },
  { id: 'mml', name: 'MathML' },
  { id: 'html', name: 'HTML' },
];

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          /* clipboard blocked; the text is visible to select anyway */
        }
      }}
    >
      {done ? 'Copied' : label}
    </button>
  );
}

export default function App() {
  const [p, setP] = useState<Params>(DEFAULTS);
  const set = <K extends keyof Params>(k: K, v: Params[K]) => setP((s) => ({ ...s, [k]: v }));

  const debounced = useDebounced(p, 300);
  const path = useMemo(() => buildPath(debounced), [debounced]);
  // Preview at a readable size regardless of the chosen scale; badges are scaled by CSS instead.
  const previewPath = useMemo(
    () => buildPath({ ...debounced, format: debounced.format === 'badge' ? 'badge' : 'svg', scale: Math.max(debounced.scale, 2.5) }),
    [debounced],
  );
  const url = `${origin()}${path}`;

  const [preview, setPreview] = useState<{ forPath: string; svg?: string; error?: string }>({ forPath: '' });
  const empty = !debounced.math.trim();
  const stale = !empty && preview.forPath !== previewPath;

  useEffect(() => {
    if (empty) return;
    const ctl = new AbortController();
    fetch(previewPath, { signal: ctl.signal })
      .then(async (r) => {
        if (!r.ok) {
          const body = (await r.json().catch(() => ({ error: `HTTP ${r.status}` }))) as { error?: string };
          setPreview({ forPath: previewPath, error: body.error ?? `HTTP ${r.status}` });
          return;
        }
        setPreview({ forPath: previewPath, svg: await r.text() });
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setPreview({ forPath: previewPath, error: 'Could not reach the API' });
      });
    return () => ctl.abort();
  }, [previewPath, empty]);

  const alt = p.math.trim().replace(/"/g, '&quot;');
  const embeds = {
    markdown: `![${alt}](${url})`,
    html: `<img src="${url}" alt="${alt}">`,
    link: url,
  };

  const previewDark = p.theme === 'dark';

  return (
    <>
      <header className="hero">
        <div className="wrap">
          <h1>
            <span className="sigma">Σ</span>igmation
          </h1>
          <p className="tagline">Math to SVG, PNG, MathML and README badges. One URL, no account.</p>
        </div>
      </header>

      <main className="wrap">
        <section className="play" aria-label="Playground">
          <div className="editor">
            <div className="row between">
              <label htmlFor="math" className="lbl">
                Math
              </label>
              <div className="seg" role="radiogroup" aria-label="Input language">
                {(['auto', 'ascii', 'tex'] as const).map((l) => (
                  <button key={l} type="button" role="radio" aria-checked={p.lang === l} className={p.lang === l ? 'on' : ''} onClick={() => set('lang', l)}>
                    {l === 'auto' ? 'Auto' : l === 'tex' ? 'TeX' : 'AsciiMath'}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              id="math"
              value={p.math}
              onChange={(e) => set('math', e.target.value)}
              rows={3}
              spellCheck={false}
              autoComplete="off"
              placeholder="sum_(i=1)^N 2^i   or   \frac{a}{b}"
            />
            <div className="chips" aria-label="Examples">
              {EXAMPLES.map((ex) => (
                <button key={ex.name} type="button" className="chip" onClick={() => setP((s) => ({ ...s, math: ex.math, lang: ex.lang }))}>
                  {ex.name}
                </button>
              ))}
            </div>
          </div>

          <div className={`preview ${previewDark ? 'dark' : ''} ${p.format === 'badge' ? 'badge' : ''}`} aria-live="polite">
            {empty ? (
              <p className="muted">Type some math to get started</p>
            ) : preview.error ? (
              <p className="err">{preview.error}</p>
            ) : preview.svg ? (
              <div className={`svg ${stale ? 'stale' : ''}`} dangerouslySetInnerHTML={{ __html: preview.svg }} />
            ) : (
              <p className="muted">Rendering…</p>
            )}
          </div>

          <div className="controls">
            <div className="seg" role="radiogroup" aria-label="Output format">
              {FORMATS.map((f) => (
                <button key={f.id} type="button" role="radio" aria-checked={p.format === f.id} className={p.format === f.id ? 'on' : ''} onClick={() => set('format', f.id)}>
                  {f.name}
                </button>
              ))}
            </div>

            <div className="grid">
              <label>
                Theme
                <select value={p.theme} onChange={(e) => set('theme', e.target.value as Params['theme'])}>
                  <option value="light">Light (black ink)</option>
                  <option value="dark">Dark (white ink)</option>
                </select>
              </label>
              <label>
                Color
                <input type="text" value={p.color} placeholder={p.theme === 'dark' ? 'ffffff' : '000000'} onChange={(e) => set('color', e.target.value)} maxLength={9} />
              </label>
              <label>
                Background
                <input type="text" value={p.bg} placeholder="transparent" onChange={(e) => set('bg', e.target.value)} maxLength={11} />
              </label>
              <label className={p.format === 'badge' ? 'off' : ''}>
                Scale
                <input type="number" min={0.25} max={8} step={0.25} value={p.scale} onChange={(e) => set('scale', Number(e.target.value) || 1)} disabled={p.format === 'badge'} />
              </label>
              <label className={`check ${p.format === 'badge' ? 'off' : ''}`}>
                <input type="checkbox" checked={p.inline} onChange={(e) => set('inline', e.target.checked)} disabled={p.format === 'badge'} />
                Inline style
              </label>
              {p.format === 'badge' && (
                <>
                  <label>
                    Badge label
                    <input type="text" value={p.label} placeholder="Σ" onChange={(e) => set('label', e.target.value)} maxLength={40} />
                  </label>
                  <label>
                    Badge color
                    <input type="text" value={p.badgeColor} placeholder="4c1" onChange={(e) => set('badgeColor', e.target.value)} maxLength={9} />
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="out">
            <code className="url" aria-label="Generated URL">
              <a href={path} target="_blank" rel="noreferrer">
                {url}
              </a>
            </code>
            <div className="row">
              <CopyButton text={embeds.link} label="Copy URL" />
              <CopyButton text={embeds.markdown} label="Copy Markdown" />
              <CopyButton text={embeds.html} label="Copy <img>" />
            </div>
          </div>
        </section>

        <Docs />
      </main>

      <footer className="wrap foot">
        <p>
          <a href="https://github.com/brianfunk/sigmation">GitHub</a> · <a href="https://www.npmjs.com/package/sigmation">npm</a> · MIT ·{' '}
          <a href="https://www.linkedin.com/in/brianrandyfunk">Brian Funk</a>
        </p>
      </footer>
    </>
  );
}
