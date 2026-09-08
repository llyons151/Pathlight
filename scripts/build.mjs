import { mkdir, copyFile } from 'node:fs/promises';
import { generate } from './generate.mjs';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'pages.css', 'app.js', 'water.js', 'globe.js', 'globe-land.js']) await copyFile(file, `dist/${file}`);
await generate('dist');
console.log('Built Pathlight in dist/');
