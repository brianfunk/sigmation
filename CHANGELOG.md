# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Vitest suite, ESLint, CI on Node 22 and 24.

### Changed
- MathJax 4 replaces mathjax-node 0.5; `@resvg/resvg-wasm` replaces svg2png/PhantomJS; Hono replaces Express; Netlify replaces Heroku.

### Removed
- Everything from 2017.

## [0.0.1] - 2017-02-19

### Added
- Express app rendering AsciiMath and TeX to SVG, PNG, MathML and HTML via mathjax-node and svg2png. Deployed to Heroku.
