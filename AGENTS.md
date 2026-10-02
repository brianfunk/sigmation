# AI Agent Instructions for sigmation

## Overview

Σigmation renders AsciiMath or TeX to SVG, PNG, MathML, HTML and shields-style badges. One TypeScript core (`src/core`) serves four surfaces: an npm library, a CLI, an HTTP API on Netlify Functions, and a React playground at https://sigmation.dev. It is a small, single-purpose project. Keep it that way.

## Key functions (`src/core/index.ts`)

- `render(input, opts?, format?)` → `{ svg, mml, width, height, options }`. Pure apart from MathJax's one-time init. Throws `SigmationError` (HTTP 400 class) on bad input, TeX syntax errors or undefined macros.
- `toSvg`, `toMml`, `toPng`, `toBadge`, `toHtml(input, rendered, { baseUrl? })`.
- `sigmation(input, format, opts?, { baseUrl? })` → `{ body, contentType, format }`. One call for every format; the CLI and API both use it.
- `optionsFromRaw(record)` and `resolveOptions(...)` in `src/core/options.ts` are the single place options are parsed and validated. Add new params there first, then to `src/api/openapi.ts`, the README table and the playground.

Options: `lang` (`tex` | `ascii` | auto), `inline`, `color`, `bg`, `theme`, `scale`, `width`, `height`, `label`, `badgeColor`. For badges, `color` is the ink for both halves (default white) and `bg` is the label field (default `555`).

## Routes (`src/api/app.ts`)

`/svg`, `/png`, `/mml`, `/html`, `/badge`, legacy `/math.{ext}` and Accept-negotiated `/math`, mirrored under `/api`; `/api/health`; `/openapi.json` (rendered by Swagger UI at `/docs/`). Output is a pure function of the URL, so responses are immutable with an ETag.

## Usage examples

```js
import { render, toPng, toBadge } from 'sigmation';
const { svg } = await render('sum_(i=1)^N 2^i');
const png = await toPng('\\frac{a}{b}', { theme: 'dark', scale: 3 });
const badge = await toBadge('E=mc^2', { label: 'physics', bg: 'ffd700' });
```

```bash
npx sigmation 'E=mc^2' -f badge --label physics > badge.svg
curl 'https://sigmation.dev/png?m=x^2&scale=3' -o x2.png
```

## Workflow (required)

1. **Never commit to `dev` directly.** It is the production branch and is protected: a PR with green CI is required to merge. Create a branch (`feat/...`, `fix/...`, `docs/...`), open a PR targeting `dev`, let CI pass, then merge.
2. Before every commit: `npm run lint && npx tsc -b && npm test`. Run `npm run test:e2e` for any site change; CI runs it too. Do not drive the user's own browser for checks; Playwright is headless.
3. Any user-facing change updates `README.md`, `CHANGELOG.md` and, if it changes how agents should work, this file, in the same PR. `AGENTS.md` is the only agent instructions file; do not add a `CLAUDE.md`.
4. npm releases: bump `version` in `package.json`, move the changelog entry under that version, merge, then tag `vX.Y.Z`. The release workflow publishes with provenance via npm trusted publishing. Do not publish from a laptop.
5. Check PR comments (`gh pr view <n> --comments`) before continuing work on a branch.

## Commands

```bash
npm install
npm test               # vitest
npm run lint           # eslint
npx tsc -b             # typecheck lib + site
npm run build          # tsup + tsc declarations to dist/, vite site to dist/site
netlify dev            # site + function on http://localhost:8890 (Vite pinned to 5600)
npm run dev:api        # API only on :8890 via @hono/node-server
npm run assets         # regenerate favicon, PNG icons and og.png from the renderer
npm run test:e2e       # Playwright (headless Chromium): no horizontal overflow at phone/tablet/desktop, playground flows, Swagger page
```

## Non-obvious decisions

- MathJax 4 via the `mathjax` component build. Its `noundefined` and `require` packages are disabled on purpose so bad TeX throws instead of rendering red text. MathJax loads components by path at runtime, so `netlify.toml` ships the package whole via `included_files`. Do not bundle it.
- PNG via `@resvg/resvg-wasm`, not native resvg, so one code path runs on Node, in the CLI and in Netlify Functions. No fonts are available at raster time: anything that must be text is rendered by MathJax (`\textsf{}`) so it becomes paths. This is why the badge label and the favicon Σ are glyph paths.
- The site is the playground plus the Swagger page only. Library, CLI and Action docs live in the README. No personal name on the site. Logo and wordmark in the header only; footer carries the Σ mark, a year-aware copyright, Source, Package and MIT links.
- `netlify dev` can serve a stale function after `src/core` edits; restart it. Killing it leaves Vite on port 5600 alive: `kill $(lsof -t -iTCP:5600)`.

## Out of scope

Accounts, rate limiting beyond Netlify defaults, server-side caches, custom fonts, PDF output.
