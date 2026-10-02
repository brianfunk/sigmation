# Claude Code instructions for sigmation

## Project context

Σigmation renders AsciiMath or TeX to SVG, PNG, MathML, HTML and shields-style badges. One core (`src/core`) serves four surfaces: npm library, CLI, HTTP API on Netlify Functions, and a React playground. It is a small, single-purpose, fun project. Keep it that way.

## Commands

```bash
npm install
npm test               # vitest (snapshots in test/__snapshots__)
npm run lint           # eslint flat config
npx tsc -b             # typecheck lib + site
npm run build          # tsup + tsc declarations to dist/, vite site to dist/site
netlify dev            # site + function on http://localhost:8890 (Vite pinned to 5600)
npm run dev:api        # API only on :8890 via @hono/node-server, no Netlify
```

## Architecture

- `src/core/render.ts`: MathJax 4 init (once per process), SVG post-processing (unwrap container, ex to px, color, bg rect, title), error detection via `data-mjx-error`. MathJax's `noundefined` and `require` packages are disabled on purpose so bad TeX throws instead of rendering red text.
- `src/core/png.ts`: resvg WASM, loaded once. Native resvg is avoided so the same code runs in Netlify Functions.
- `src/core/badge.ts`: label rendered with `\textsf{}` so the badge is pure paths and needs no fonts at raster time.
- `src/core/options.ts`: the single place that parses and validates options for the API, CLI and library. Add new params here first.
- `src/api/app.ts`: Hono app. Pure function of the URL, so immutable cache + ETag.
- `netlify/functions/api.ts`: Functions v2 wrapper with `config.path`. `netlify.toml` ships `mathjax`, its font package and the resvg wasm via `included_files` because MathJax loads components by path at runtime. Do not bundle them.
- `src/api/openapi.ts`: OpenAPI 3.1 spec served at `/openapi.json`. Update it whenever a route or param changes; `test/api.test.ts` checks its paths against the routes.
- `src/site`: Vite + React 19, no router, no state library. Playground state is serialized to the URL hash by `encodeState`/`decodeState` in `src/site/url.ts`; QR codes come from `uqr`. Multi-page: `index.html` (playground) and `docs/index.html` (Swagger UI from the jsdelivr CDN, reading `/openapi.json`).
- `scripts/assets.mts` (`npm run assets`): regenerates `public/favicon.svg`, PNG icons and `og.png` using the renderer itself, so no fonts are needed. Rerun after changing the brand color or favicon.

## Gotchas

- `netlify dev` does not always rebuild the function when files under `src/core` change; restart it when an API response looks stale. Killing `netlify dev` leaves the child Vite on port 5600 alive, so free the port first (`kill $(lsof -t -iTCP:5600)`).

## Rules

- ESM only, TypeScript strict, no new runtime dependencies without a reason in the PR.
- Run `npm run lint && npx tsc -b && npm test` before every commit.
- Update `CHANGELOG.md` for user-facing changes.
- PRs target `dev`, which is also the production branch: merging deploys to https://sigmations.netlify.app. There is no master. Tags `vX.Y.Z` publish to npm via `.github/workflows/release.yml` (trusted publishing); `v1` is the floating Action tag.
- Keep the ASCII-art Σ header in `src/core/index.ts`, `src/cli.ts`, and the site HTML.
- Website content rules (from the owner): the site is the playground plus the Swagger API page. No npm, CLI or GitHub Action docs on the site, no README-style badge showcase, no personal name anywhere on the page. Logo and wordmark live in the header only; footer carries the Σ mark, a year-aware copyright, Source, Package and MIT links.
- After any user-facing change, update README.md, CHANGELOG.md and this file in the same PR.
- Check PR comments (`gh pr view <n> --comments`) before continuing work on a branch.

## Out of scope

Accounts, rate limiting beyond Netlify defaults, server-side caches, custom fonts, PDF output.
