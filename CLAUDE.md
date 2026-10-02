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
- `src/site`: Vite + React 19, no router, no state library.

## Rules

- ESM only, TypeScript strict, no new runtime dependencies without a reason in the PR.
- Run `npm run lint && npx tsc -b && npm test` before every commit.
- Update `CHANGELOG.md` for user-facing changes.
- PRs target `dev`, which is also the production branch: merging deploys to https://sigmations.netlify.app. There is no master. Tags `vX.Y.Z` publish to npm via `.github/workflows/release.yml` (trusted publishing); `v1` is the floating Action tag.
- Keep the ASCII-art Σ header in `src/core/index.ts`, `src/cli.ts`, and the site HTML.
- Check PR comments (`gh pr view <n> --comments`) before continuing work on a branch.

## Out of scope

Accounts, rate limiting beyond Netlify defaults, server-side caches, custom fonts, PDF output.
