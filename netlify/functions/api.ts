import type { Config } from '@netlify/functions';
import { handle } from 'hono/netlify';
import app from '../../src/api/app.js';

const FN_PREFIX = '/.netlify/functions/api';

const honoHandler = handle(app);

/** Strip the function prefix if Netlify invoked us by its internal path, so Hono sees public routes. */
export default (req: Request, context: unknown) => {
  const url = new URL(req.url);
  if (url.pathname.startsWith(FN_PREFIX)) {
    url.pathname = url.pathname.slice(FN_PREFIX.length) || '/';
    req = new Request(url, req);
  }
  return honoHandler(req, context);
};

export const config: Config = {
  path: ['/svg', '/png', '/mml', '/html', '/badge', '/math', '/math.*', '/render', '/openapi.json', '/api/*'],
};
