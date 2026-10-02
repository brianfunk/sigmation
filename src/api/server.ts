import { serve } from '@hono/node-server';
import app from './app.js';

const port = Number(process.env.PORT ?? 8890);
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`\n  Σigmation API listening at http://localhost:${info.port}\n`);
});
