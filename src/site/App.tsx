import { useEffect, useMemo, useState, type JSX } from 'react';
import { EXAMPLES } from './examples';
import { DEFAULTS, buildPath, decodeState, encodeState, origin, type Format, type Params } from './url';
import { renderSVG as qrSvg } from 'uqr';
import Nav from './Nav';
import ColorField from './ColorField';
import { BadgeIcon, CheckIcon, CodeIcon, CopyIcon, DownloadIcon, HtmlIcon, ImageIcon, LinkIcon, MarkdownIcon, MathMLIcon, QrIcon, ShareIcon, VectorIcon } from './Icons';

const FORMATS: Array<{ id: Format; name: string; icon: () => JSX.Element; ext: string }> = [
  { id: 'svg', name: 'SVG', icon: VectorIcon, ext: 'svg' },
  { id: 'png', name: 'PNG', icon: ImageIcon, ext: 'png' },
  { id: 'mml', name: 'MathML', icon: MathMLIcon, ext: 'mml' },
  { id: 'html', name: 'HTML', icon: HtmlIcon, ext: 'html' },
  { id: 'badge', name: 'Badge', icon: BadgeIcon, ext: 'svg' },
];

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Rasterize an SVG string in the browser to a PNG blob. */
function svgToPngBlob(svg: string, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
    };
    img.onerror = () => reject(new Error('svg load failed'));
    img.src = url;
  });
}

function QrPanel({ svg, name }: { svg: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      const blob = await svgToPngBlob(svg, 512);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard images unsupported in this browser */
    }
  };
  const download = async () => {
    try {
      const blob = await svgToPngBlob(svg, 1024);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="qr">
      <div className="qrcode" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="qractions">
        <button type="button" className="btn icon" onClick={copy} title="Copy QR code as image" aria-label="Copy QR code as image">
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
        <button type="button" className="btn icon" onClick={download} title="Download QR code as PNG" aria-label="Download QR code as PNG">
          <DownloadIcon />
        </button>
      </div>
      <p className="muted">Scan to open the rendered image.</p>
    </div>
  );
}

function CopyButton({ text, label, icon }: { text: string; label: string; icon: () => JSX.Element }) {
  const [done, setDone] = useState(false);
  const Icon = done ? CheckIcon : icon;
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
      <Icon />
      {done ? 'Copied' : label}
    </button>
  );
}

export default function App() {
  const [p, setP] = useState<Params>(() => (typeof window === 'undefined' ? DEFAULTS : decodeState(window.location.hash)));
  const [showQr, setShowQr] = useState(false);
  const [shared, setShared] = useState(false);
  const set = <K extends keyof Params>(k: K, v: Params[K]) => setP((s) => ({ ...s, [k]: v }));

  const debounced = useDebounced(p, 300);
  const path = useMemo(() => buildPath(debounced), [debounced]);
  // Preview at a readable size regardless of the chosen scale; badges are scaled by CSS instead.
  const previewPath = useMemo(
    () => buildPath({ ...debounced, format: debounced.format === 'badge' ? 'badge' : 'svg', scale: Math.max(debounced.scale, 2.5) }),
    [debounced],
  );
  const url = `${origin()}${path}`;
  const permalink = `${origin()}/${encodeState(debounced)}`;

  // Keep the page URL in sync so it can be shared or bookmarked (no history entries).
  useEffect(() => {
    const hash = encodeState(debounced);
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash || window.location.pathname);
  }, [debounced]);

  async function share() {
    const data = { title: `Σigmation: ${debounced.math}`, text: debounced.math, url: permalink };
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(permalink);
      setShared(true);
      setTimeout(() => setShared(false), 1200);
    } catch {
      /* user cancelled or clipboard blocked */
    }
  }

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
      <Nav />
      <header className="hero">
        <div className="wrap">
          <h1 className="tagline">Math to SVG, PNG, MathML and badges.</h1>
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

          <div className="output">
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
                    <f.icon />
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
                <ColorField
                  label={p.format === 'badge' ? 'Ink' : 'Color'}
                  value={p.color}
                  fallback={p.format === 'badge' ? 'ffffff' : p.theme === 'dark' ? 'ffffff' : '000000'}
                  fallbackLabel={p.format === 'badge' ? 'ffffff' : p.theme === 'dark' ? 'ffffff' : '000000'}
                  onChange={(v) => set('color', v)}
                />
                <ColorField
                  label={p.format === 'badge' ? 'Label field' : 'Background'}
                  value={p.bg}
                  fallback={p.format === 'badge' ? '555555' : 'ffffff'}
                  fallbackLabel={p.format === 'badge' ? '555' : 'transparent'}
                  onChange={(v) => set('bg', v)}
                />
                <label className={p.format === 'badge' ? 'off' : ''}>
                  Scale
                  <input type="number" min={0.25} max={8} step={0.25} value={p.scale} onChange={(e) => set('scale', Number(e.target.value) || 1)} disabled={p.format === 'badge'} />
                </label>
                <label className={`check ${p.format === 'badge' ? 'off' : ''}`} title="Text-style layout, as math set inside a sentence: limits beside operators, smaller fractions. Default is display style, as a standalone equation.">
                  <input type="checkbox" checked={p.inline} onChange={(e) => set('inline', e.target.checked)} disabled={p.format === 'badge'} />
                  Compact (text style)
                </label>
                {p.format === 'badge' && (
                  <>
                    <label>
                      Badge label
                      <select
                        value={p.label === '' || p.label === 'Σigmation' ? p.label : 'custom'}
                        onChange={(e) => set('label', e.target.value === 'custom' ? 'label' : e.target.value)}
                      >
                        <option value="">Σ</option>
                        <option value="Σigmation">Σigmation</option>
                        <option value="custom">Custom…</option>
                      </select>
                    </label>
                    {p.label !== '' && p.label !== 'Σigmation' && (
                      <label>
                        Custom label
                        <input type="text" value={p.label} onChange={(e) => set('label', e.target.value || 'label')} maxLength={40} />
                      </label>
                    )}
                    <ColorField label="Equation field" value={p.badgeColor} fallback="4c1" fallbackLabel="4c1" onChange={(v) => set('badgeColor', v)} />
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
                <a className="btn" href={path} download={`sigmation.${FORMATS.find((f) => f.id === p.format)?.ext ?? 'svg'}`}>
                  <DownloadIcon />
                  Download
                </a>
                <CopyButton text={embeds.link} label="Copy URL" icon={LinkIcon} />
                <CopyButton text={embeds.markdown} label="Copy Markdown" icon={MarkdownIcon} />
                <CopyButton text={embeds.html} label="Copy <img>" icon={CodeIcon} />
                <button type="button" className={`btn ${showQr ? 'on' : ''}`} onClick={() => setShowQr((v) => !v)} aria-pressed={showQr} title="QR code that opens this image">
                  <QrIcon />
                  QR
                </button>
                <button type="button" className="btn" onClick={share} title="Share a link to this equation in the playground">
                  {shared ? <CheckIcon /> : <ShareIcon />}
                  {shared ? 'Link copied' : 'Share'}
                </button>
              </div>
              {showQr && !empty && <QrPanel svg={qrSvg(url, { border: 1, pixelSize: 4 })} name="sigmation-qr.png" />}
            </div>
          </div>
        </section>

      </main>

      <footer className="wrap foot">
        <p>
          <img className="mark" src="/favicon.svg" alt="" width="20" height="20" /> © {new Date().getFullYear()} Σigmation ·{' '}
          <a href="https://github.com/brianfunk/sigmation">Source</a> ·{' '}
          <a href="https://www.npmjs.com/package/sigmation">Package</a> · <a href="https://opensource.org/licenses/MIT">MIT license</a>
        </p>
      </footer>
    </>
  );
}
