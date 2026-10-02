import { FORMATS, MAX_INPUT_LENGTH } from '../core/options.js';

const SERVER = 'https://sigmations.netlify.app';

const q = (name: string, description: string, schema: object, required = false) => ({
  name,
  in: 'query',
  required,
  description,
  schema,
});

const hex = { type: 'string', pattern: '^#?([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$', example: 'ff6600' };

const COMMON = [
  q('m', 'The math to render. Aliases: `math`, `input`, `s`.', { type: 'string', maxLength: MAX_INPUT_LENGTH, example: 'sum_(i=1)^N 2^i' }, true),
  q('l', 'Input language. Default: auto-detect (`\\` or `$` means TeX).', { type: 'string', enum: ['tex', 'ascii'] }),
  q('theme', 'Ink shorthand: `light` = black, `dark` = white. Explicit `color` wins.', { type: 'string', enum: ['light', 'dark'], default: 'light' }),
  q('color', 'Ink color, hex.', { ...hex, default: '000000' }),
  q('bg', 'Background, hex or `transparent`.', { oneOf: [hex, { type: 'string', enum: ['transparent'] }], default: 'transparent' }),
  q('scale', 'Size multiplier.', { type: 'number', minimum: 0.25, maximum: 8, default: 1 }),
  q('inline', '`1` for text-style instead of display-style math.', { type: 'string', enum: ['0', '1'], default: '0' }),
];

const PNG_ONLY = [
  q('w', 'Exact output width in px. Beats `scale`.', { type: 'integer', minimum: 1, maximum: 4096 }),
  q('h', 'Exact output height in px.', { type: 'integer', minimum: 1, maximum: 4096 }),
];

const BADGE_ONLY = [
  q('label', 'Left-side label.', { type: 'string', default: 'Σ', maxLength: 40 }),
  q('badgeColor', 'Right-side background, hex.', { ...hex, default: '4c1' }),
];

const error = {
  description: 'Bad input: missing or oversized math, invalid option, TeX syntax error, undefined macro.',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'TeX error: Missing close brace' } } },
};

const cacheHeaders = {
  'Cache-Control': { description: 'Output is a pure function of the URL, so responses are immutable for a year.', schema: { type: 'string', example: 'public, max-age=31536000, immutable' } },
  ETag: { schema: { type: 'string' } },
};

const ok = (mime: string, description: string, schemaFormat: 'binary' | 'text' = 'text') => ({
  '200': {
    description,
    headers: cacheHeaders,
    content: { [mime]: { schema: schemaFormat === 'binary' ? { type: 'string', format: 'binary' } : { type: 'string' } } },
  },
  '400': error,
});

const render = (summary: string, description: string, params: object[], responses: object, tag = 'Render') => ({
  get: { tags: [tag], summary, description, parameters: params, responses },
});

export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'Σigmation API',
    version: '1',
    summary: 'Math to SVG, PNG, MathML, HTML and badges by URL.',
    description:
      'Every endpoint is a `GET` that returns the rendered math. Put the URL anywhere an image works. ' +
      'Input is AsciiMath or TeX, auto-detected unless `l` is set. Bad input returns a JSON `400` with an `error` message.\n\n' +
      'Source and library/CLI docs: https://github.com/brianfunk/sigmation',
    license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
  },
  servers: [{ url: SERVER }],
  tags: [
    { name: 'Render', description: 'Rendered output in a given format.' },
    { name: 'Legacy', description: 'Routes kept from the 2017 API.' },
    { name: 'Meta' },
  ],
  paths: {
    '/svg': render('SVG', 'Standalone SVG document sized in px.', COMMON, ok('image/svg+xml', 'SVG image')),
    '/png': render('PNG', 'Rasterized PNG. Default `scale` is 2 for crispness. Fully transparent unless `bg` is set.', [...COMMON, ...PNG_ONLY], ok('image/png', 'PNG image', 'binary')),
    '/badge': render(
      'Badge',
      'Shields-style pill: label on the left, equation on a colored field on the right. 20px tall, pure vector paths. ' +
        'For badges, `color` is the ink for both halves (default white), `bg` is the label field (default `555`), `badgeColor` is the equation field.',
      [COMMON[0]!, COMMON[1]!, q('color', 'Ink for label and equation, hex.', { ...hex, default: 'ffffff' }), q('bg', 'Label field background, hex.', { ...hex, default: '555' }), ...BADGE_ONLY],
      ok('image/svg+xml', 'SVG badge'),
    ),
    '/mml': render('MathML', 'Presentation MathML.', [COMMON[0]!, COMMON[1]!, COMMON[6]!], ok('application/mathml+xml', 'MathML document')),
    '/html': render('HTML page', 'A minimal standalone HTML page with the SVG inline, for linking rather than embedding.', COMMON, ok('text/html', 'HTML page')),
    '/math.{ext}': {
      get: {
        tags: ['Legacy'],
        summary: 'Format by extension',
        parameters: [{ name: 'ext', in: 'path', required: true, schema: { type: 'string', enum: ['svg', 'png', 'mml', 'html'] } }, ...COMMON, ...PNG_ONLY],
        responses: { '200': { description: 'Rendered output in the requested format.', headers: cacheHeaders }, '400': error },
      },
    },
    '/math': {
      get: {
        tags: ['Legacy'],
        summary: 'Format by Accept header',
        description: 'Picks the format from the `Accept` (or `Content-Type`) header: `image/png`, `image/svg+xml`, `application/mathml+xml`, `text/html`. Defaults to SVG.',
        parameters: [...COMMON, ...PNG_ONLY],
        responses: { '200': { description: 'Rendered output.', headers: cacheHeaders }, '400': error },
      },
    },
    '/api/health': {
      get: { tags: ['Meta'], summary: 'Health check', responses: { '200': { description: 'OK', content: { 'application/json': { example: { ok: true, formats: FORMATS } } } } } },
    },
    '/openapi.json': {
      get: { tags: ['Meta'], summary: 'This document', responses: { '200': { description: 'OpenAPI 3.1 JSON' } } },
    },
  },
  components: {
    schemas: {
      Error: { type: 'object', required: ['error'], properties: { error: { type: 'string' } } },
    },
  },
} as const;
