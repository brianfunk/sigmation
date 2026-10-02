/*

 ______ _                       _   _
 \  ___|_)                     | | (_)
  \ \   _  __ _ _ __ ___   __ _| |_ _  ___  _ __
   > > | |/ _` | '_ ` _ \ / _` | __| |/ _ \| '_ \
  / /__| | (_| | | | | | | (_| | |_| | (_) | | | |
 /_____)_|\__, |_| |_| |_|\__,_|\__|_|\___/|_| |_|
           __/ |
          |___/

  HTTP API. Runs unchanged on Node, Netlify Functions, and in tests via app.request().

*/

import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { createHash } from 'node:crypto';
import { FORMATS, SigmationError, normalizeFormat, optionsFromRaw, sigmation, type Format } from '../core/index.js';
import { openapi } from './openapi.js';

const ONE_YEAR = 'public, max-age=31536000, immutable';

const ACCEPT_TO_FORMAT: Array<[string, Format]> = [
  ['image/png', 'png'],
  ['image/svg+xml', 'svg'],
  ['application/mathml+xml', 'mml'],
  ['application/mathml-presentation+xml', 'mml'],
  ['text/html', 'html'],
];

/** Pick a format from the Accept header (and the 2017 content-type trick), defaulting to svg. */
function formatFromHeaders(c: Context): Format {
  const accept = `${c.req.header('accept') ?? ''},${c.req.header('content-type') ?? ''}`.toLowerCase();
  for (const [mime, fmt] of ACCEPT_TO_FORMAT) if (accept.includes(mime)) return fmt;
  return 'svg';
}

function queryRaw(c: Context): Record<string, string | undefined> {
  const q = c.req.query();
  return { ...q, m: q.m ?? q.math ?? q.input ?? q.sigma ?? q.s };
}

async function handle(c: Context, format: Format): Promise<Response> {
  const raw = queryRaw(c);
  const out = await sigmation(raw.m, format, optionsFromRaw(raw), { baseUrl: new URL(c.req.url).origin });
  const etag = `"${createHash('sha1').update(c.req.url).digest('base64url').slice(0, 20)}"`;
  if (c.req.header('if-none-match') === etag) return c.body(null, 304);

  return new Response(out.body as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': out.contentType,
      'Cache-Control': ONE_YEAR,
      ETag: etag,
      'Content-Disposition': `inline; filename="sigmation.${format === 'badge' ? 'svg' : format}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export const app = new Hono();

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'HEAD', 'OPTIONS'] }));

app.onError((err, c) => {
  if (err instanceof SigmationError) {
    return c.json({ error: err.message }, 400, { 'Cache-Control': 'no-store' });
  }
  console.error(err);
  return c.json({ error: 'Internal error' }, 500, { 'Cache-Control': 'no-store' });
});

app.notFound((c) => c.json({ error: 'Not found', routes: FORMATS.map((f) => `/${f}?m=...`) }, 404));

const routes = new Hono();

routes.get('/health', (c) => c.json({ ok: true, formats: FORMATS }));
routes.get('/openapi.json', (c) => c.json(openapi, 200, { 'Cache-Control': 'public, max-age=3600' }));

// Primary routes: /svg /png /mml /html /badge
for (const f of FORMATS) routes.get(`/${f}`, (c) => handle(c, f));

// 2017 routes: /math.svg, /math.png, ... and /math with Accept negotiation
routes.get('/:file{math\\.[a-z]+}', (c) => handle(c, normalizeFormat(c.req.param('file').slice('math.'.length))));
routes.get('/math', (c) => handle(c, formatFromHeaders(c)));
routes.get('/render', (c) => handle(c, formatFromHeaders(c)));

app.route('/', routes);
app.route('/api', routes);

export default app;
