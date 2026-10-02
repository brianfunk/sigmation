# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Playwright e2e suite (`npm run test:e2e`, also in CI): no horizontal overflow at phone, tablet and desktop widths, badge and QR flows, hash round-trip, inline TeX errors, Swagger page.
- Playground state lives in the page URL hash, so a link to the site reopens the same equation, format and colors.
- QR button (code that opens the rendered image, with copy-as-image and download-PNG buttons) and Share button (Web Share API, falling back to copying the playground link).
- Swagger UI API reference at `/docs/`, driven by an OpenAPI 3.1 spec served at `/openapi.json` (and `/api/openapi.json`). A test asserts the spec's paths match the live routes.
- Playground: famous-equation samples (Pythagoras, mass–energy, Schrödinger, Einstein field, Newton, entropy, normal distribution, Fourier), color picker swatches for color, background and badge color, badge label dropdown, Download button, icons on format tabs and actions, light/dark mode toggle.
- SEO and icons: canonical, Open Graph and Twitter tags, generated `og.png`, JSON-LD, web manifest, PNG icons, `robots.txt`, `sitemap.xml`. Favicon rebuilt from a MathJax Σ glyph path. `npm run assets` regenerates them.
- PNG transparency regression tests (fully transparent unless `bg` is set).

### Fixed
- Mobile layout: format tabs and language toggle wrap instead of overflowing; color fields fit their grid cell at 375px.

### Removed
- `CLAUDE.md`. `AGENTS.md` is the single agent instructions file.

### Changed
- Website is the playground only: npm, CLI and GitHub Action docs live in the README. Logo and wordmark moved into the header; footer shows a year-aware copyright and no personal name.
- Format tab order: SVG, PNG, MathML, HTML, Badge. The `inline` option is labeled "Compact (text style)".
- Site URL is `sigmation.dev` (custom domain, replacing sigmations.netlify.app); `dev` is the production branch.

## [1.0.4] - 2026-10-02

### Added
- `/html` pages carry Open Graph and Twitter tags with a per-equation PNG, so pasting an `/html` link into Slack, Discord or X unfurls with the rendered math. Library: `toHtml(input, rendered, { baseUrl })` and `sigmation(..., { baseUrl })`. (Listed under 1.0.3 earlier by mistake; it shipped here.)

## [1.0.3] - 2026-10-02

### Changed
- Badges honor `color` (ink for both halves, default white) and `bg` (label field, default `555`). Previously both were ignored.

## [1.0.2] - 2026-10-02

### Fixed
- CLI did nothing when run through `npx sigmation` or a global install, because it only started when invoked as `cli.js` directly. CI now installs the packed tarball and runs the bin.

## [1.0.1] - 2026-10-02

### Fixed
- Badge SVG now carries a `viewBox`, so it scales correctly when given a CSS or attribute height.
- Playground badge preview scales only the outer SVG.

## [1.0.0] - 2026-10-01

Full rewrite. Same idea as 2017, none of the same code.

### Added
- `render()`, `toSvg()`, `toPng()`, `toMml()`, `toBadge()`, `toHtml()` and the one-call `sigmation()` library API, published to npm as ESM with types.
- CLI: `npx sigmation '<math>' [-f svg|png|mml|html|badge] [-o file] [--theme dark] ...`
- HTTP API on Netlify Functions: `/svg`, `/png`, `/mml`, `/html`, `/badge`, mirrored under `/api`, plus the 2017 `/math.*` routes.
- Shields-style `/badge` output rendered entirely as glyph paths.
- Options: `theme`, `color`, `bg`, `scale`, `inline`, `width`, `height`, `label`, `badgeColor`, with query and CLI aliases.
- Immutable cache headers and ETag on every API response; JSON 400 for bad input, including TeX syntax errors and undefined macros.
- React playground with live preview, copy-as-URL/Markdown/`<img>`, and docs.
- Composite GitHub Action that renders an equation to a file.
- Vitest suite, ESLint, CI on Node 22 and 24, `AGENTS.md` for agent instructions.

### Changed
- MathJax 4 replaces mathjax-node 0.5; `@resvg/resvg-wasm` replaces svg2png/PhantomJS; Hono replaces Express; Netlify replaces Heroku.

### Removed
- Everything from 2017.

## [0.0.1] - 2017-02-19

### Added
- Express app rendering AsciiMath and TeX to SVG, PNG, MathML and HTML via mathjax-node and svg2png. Deployed to Heroku.
