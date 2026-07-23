/**
 * Fetches the Figma file WITH vector path geometry.
 *
 * `figma/file.json` (from pull.mjs) has 301 VECTOR nodes and zero geometry —
 * Figma omits `fillGeometry` / `strokeGeometry` unless `?geometry=paths` is
 * requested. Without it the icons cannot be reconstructed at all.
 *
 * This uses the /files endpoint, which has a separate quota from /images. That
 * matters: /images was exhausted with a retry-after of ~105 hours while /files
 * kept returning 200, so geometry is the route that actually works.
 *
 *   node figma/pull-geometry.mjs   # -> figma/file-geometry.json (gitignored)
 *   node figma/build-svgs.mjs      # -> figma/assets/*.svg
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'file-geometry.json');

const envPath = path.join(HERE, '.env.figma.local');
if (!existsSync(envPath)) {
  console.error(
    'figma/.env.figma.local is missing.\n' +
      '  cp figma/env.figma.example figma/.env.figma.local\n' +
      '  then set FIGMA_TOKEN (scope "File content: Read") and FIGMA_FILE_KEY.'
  );
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '' && !line.trim().startsWith('#'))
    .map((line) => {
      const at = line.indexOf('=');
      return [
        line.slice(0, at).trim(),
        line
          .slice(at + 1)
          .trim()
          .replace(/^["']|["']$/g, ''),
      ];
    })
);

const response = await fetch(
  `https://api.figma.com/v1/files/${env.FIGMA_FILE_KEY}?geometry=paths`,
  { headers: { 'X-Figma-Token': env.FIGMA_TOKEN } }
);

if (!response.ok) {
  console.error(`Figma API ${response.status} ${response.statusText}`);
  console.error(await response.text());
  process.exit(1);
}

const body = await response.text();
writeFileSync(OUT, body, 'utf8');

const doc = JSON.parse(body).document;
let vectors = 0;
let withGeometry = 0;
const walk = (n) => {
  if (n.type === 'VECTOR') {
    vectors++;
    if (n.fillGeometry?.length || n.strokeGeometry?.length) withGeometry++;
  }
  for (const c of n.children ?? []) walk(c);
};
walk(doc);

console.log(`Wrote ${OUT} (${(body.length / 1e6).toFixed(1)} MB)`);
console.log(`VECTOR nodes: ${vectors}, with geometry: ${withGeometry}`);
if (withGeometry < vectors) {
  console.warn('Some vectors returned no geometry — re-check the ?geometry=paths parameter.');
}
