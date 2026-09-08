import { generate } from './generate.mjs';
import { createSiteServer } from './server.mjs';
const production = process.argv.includes('--production');
const portIndex = process.argv.indexOf('--port');
const port = Number(
  process.env.PORT || (portIndex >= 0 ? process.argv[portIndex + 1] : 5173),
);
if (!production) await generate('.generated');
createSiteServer({
  root: production ? 'dist' : '.',
  generated: production ? 'dist' : '.generated',
}).listen(port, '0.0.0.0', () =>
  console.log(`Pathlight running at http://localhost:${port}`),
);
