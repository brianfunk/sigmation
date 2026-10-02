import { serve } from '@hono/node-server';
import app from './app.js';

const port = Number(process.env.PORT ?? 8888);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`\n  Σigmation API listening at http://localhost:${info.port}\n`);
});
