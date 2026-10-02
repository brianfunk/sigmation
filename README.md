[![Σigmation](https://sigmations.netlify.app/badge?m=sum_(i=1)^N%202^i&label=%CE%A3igmation)](https://sigmations.netlify.app)
[![npm version](https://img.shields.io/npm/v/sigmation.svg)](https://www.npmjs.com/package/sigmation)
[![CI](https://github.com/brianfunk/sigmation/actions/workflows/ci.yml/badge.svg)](https://github.com/brianfunk/sigmation/actions/workflows/ci.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/648ac12f-d7d2-4902-9c94-7ff5f0e0f5df/deploy-status)](https://app.netlify.com/projects/sigmation/deploys)
[![Semver](https://img.shields.io/badge/SemVer-2.0-blue.svg)](http://semver.org/spec/v2.0.0.html)
[![License](https://img.shields.io/github/license/mashape/apistatus.svg)](https://opensource.org/licenses/MIT)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badge/)
[![LinkedIn](https://img.shields.io/badge/Linked-In-blue.svg)](https://www.linkedin.com/in/brianrandyfunk)

# Σigmation

> Math to SVG, PNG, MathML and badges.

Paste a URL, get rendered math. Works anywhere an image works: Slack, Discord, Notion, email, blogs, GitHub READMEs. AsciiMath or TeX in, MathJax 4 out. Free API, npm library, CLI and GitHub Action, all from the same 200 lines of core.

```
https://sigmations.netlify.app/svg?m=sum_(i=1)^N 2^i
https://sigmations.netlify.app/png?m=\frac{a}{b}&theme=dark&scale=3
https://sigmations.netlify.app/badge?m=E=mc^2&label=physics
```

![sum](https://sigmations.netlify.app/png?m=sum_(i=1)^N%202^i&scale=3)
![physics](https://sigmations.netlify.app/badge?m=E=mc^2&label=physics)

Try it live at **[sigmations.netlify.app](https://sigmations.netlify.app)**. Interactive API reference (Swagger UI): **[sigmations.netlify.app/docs](https://sigmations.netlify.app/docs/)**, spec at [`/openapi.json`](https://sigmations.netlify.app/openapi.json).

## API

Every endpoint is a `GET`. Output is a pure function of the URL, so responses are immutable and cached for a year. Bad input returns a JSON `400` with an `error` message.

| Route | Returns |
|---|---|
| `/svg?m=…` | `image/svg+xml` |
| `/png?m=…` | `image/png` |
| `/badge?m=…&label=…` | shields-style SVG badge |
| `/mml?m=…` | `application/mathml+xml` |
| `/html?m=…` | standalone HTML page with Open Graph tags, so the link unfurls as the rendered math in chat apps |
| `/math.{svg,png,mml,html}?m=…` | the 2017 routes, still alive |
| `/api/…` | everything above, mirrored |
| `/openapi.json` | OpenAPI 3.1 spec, rendered at [`/docs/`](https://sigmations.netlify.app/docs/) |
| `/api/health` | `{ ok: true, formats: [...] }` |

| Param | Meaning | Default |
|---|---|---|
| `m` | the math (aliases `math`, `input`, `s`) | required |
| `l` | `tex` or `ascii` | auto-detect (`\` or `$` means TeX) |
| `theme` | `light` or `dark` (sets the ink color) | `light` |
| `color` | hex ink color | `000000` |
| `bg` | hex background or `transparent` | `transparent` |
| `scale` | size multiplier, 0.25 to 8 | `1` (png: `2`) |
| `inline` | `1` for text-style instead of display-style | `0` |
| `w`, `h` | exact width or height in px (png only) | |
| `label` | badge label | `Σ` |
| `badgeColor` | badge right-side (equation field) hex | `4c1` |

For `/badge`, `color` is the ink for both halves (default `ffffff`) and `bg` is the label field (default `555`).

Input is limited to 2000 characters. TeX runs with the standard MathJax packages minus `\require`.

## npm

```bash
npm install sigmation
```

```js
import { render, toSvg, toPng, toMml, toBadge, sigmation } from 'sigmation';

const { svg, mml, width, height } = await render('sum_(i=1)^N 2^i');
const png = await toPng('\\frac{a}{b}', { theme: 'dark', scale: 3 });
const badge = await toBadge('E=mc^2', { label: 'physics' });

// one call for any format
const { body, contentType } = await sigmation('x^2', 'png', { bg: 'ffffff' });
```

All functions accept the same options as the API (`lang`, `inline`, `color`, `bg`, `theme`, `scale`, `width`, `height`, `label`, `badgeColor`). Bad input throws a `SigmationError`. Requires Node 22+.

## CLI

```bash
npx sigmation 'sum_(i=1)^N 2^i' > sum.svg
npx sigmation '\frac{a}{b}' -o frac.png --scale 3 --theme dark
echo 'E=mc^2' | npx sigmation -f badge --label physics > badge.svg
npx sigmation --help
```

The format is inferred from the `-o` extension, or set with `-f`.

## GitHub Action

Render equations into your repo at build time instead of hotlinking.

```yaml
- uses: brianfunk/sigmation/action@v1
  with:
    math: 'sum_(i=1)^N 2^i'
    out: docs/sum.svg
    theme: dark
```

Inputs: `math` (required), `out` (required), `format`, `lang`, `theme`, `color`, `bg`, `scale`, `label`.

## Playground

The website at [sigmations.netlify.app](https://sigmations.netlify.app) is a playground: type AsciiMath or TeX, pick a format, theme, colors (with pickers), scale and layout, then copy the URL, Markdown or `<img>` tag, download the file, show a QR code that opens the image, or share a link that reopens the playground in the same state (the state is kept in the URL hash). Famous equations are one click away. It has a light/dark mode and links to the Swagger API reference, this repo and the npm package. Library, CLI and Action usage are documented here only, not on the site.

## Development

```bash
npm install
npm test            # vitest
npm run lint        # eslint
npm run build       # lib + cli to dist/, site to dist/site
netlify dev         # site + API on http://localhost:8890 (Vite pinned to 5600)
npm run dev:api     # API alone on :8890 without Netlify
npm run assets      # regenerate favicon, PNG icons and og.png in public/
npm run test:e2e    # Playwright: layout at phone/tablet/desktop widths plus playground flows
```

Layout:

- `src/core`: the renderer (MathJax 4 + resvg WASM), options, badge, HTML wrapper
- `src/api/app.ts`: the Hono app; `src/api/openapi.ts`: the OpenAPI spec it serves
- `src/cli.ts`: the CLI
- `src/site`: the React playground; `src/site/docs/`: the Swagger UI page
- `netlify/functions/api.ts`: the Netlify Functions wrapper
- `scripts/assets.mts`: generates the icons and Open Graph image in `public/`
- `action/action.yml`: the composite GitHub Action

Branches: `dev` is production, protected, and deploys to Netlify on every merge. All changes go through a PR targeting `dev` with green CI. Agent-facing notes live in `AGENTS.md`.

## Releasing

Bump `version` in `package.json` and `CHANGELOG.md`, merge to `dev`, then tag. The release workflow publishes to npm with provenance via trusted publishing (no token stored).

```bash
git tag v1.0.0 && git push origin v1.0.0
git tag -f v1 && git push -f origin v1   # moves the Action's major tag
```

## Copyright and license

Code and documentation copyright 2016-2026 Brian Funk. Code released under [the MIT license](https://opensource.org/licenses/MIT).
