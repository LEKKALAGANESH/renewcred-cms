/**
 * Exports every vector asset in the design as SVG.
 *
 * `file.json` contains 301 VECTOR nodes and ZERO path geometry — Figma omits
 * `fillGeometry` unless the file is requested with `geometry=paths`. So the
 * icons and the logo cannot be reconstructed from the JSON at all; they must
 * come from the images endpoint. Cropping them out of the 1x PNG render would
 * produce blurry rasters, which is the placeholder substitution this project
 * forbids.
 *
 * Setup (one time):
 *   1. Figma -> avatar -> Settings -> Security -> Personal access tokens.
 *      Scope needed: "File content: Read".
 *   2. cp figma/env.figma.example figma/.env.figma.local
 *   3. Fill in FIGMA_TOKEN and FIGMA_FILE_KEY (file key is in the file's URL).
 *
 * Then:
 *   node figma/pull-assets.mjs           # writes figma/assets/<slug>.svg
 *   node figma/pull-assets.mjs --list    # show what would be exported, no network
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const API = 'https://api.figma.com/v1';
const OUT_DIR = path.join(HERE, 'assets');
const listOnly = process.argv.includes('--list');

function loadEnv() {
  const envPath = path.join(HERE, '.env.figma.local');
  if (!existsSync(envPath)) return {};
  return Object.fromEntries(
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
}

const doc = JSON.parse(readFileSync(path.join(HERE, 'file.json'), 'utf8'));

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

/**
 * Exports the smallest node that fully contains an icon, not each individual
 * path. A 13-path logo must arrive as one SVG; 13 separate files would have to
 * be reassembled by hand, which is how a wordmark ends up rebuilt as text.
 */
function collectAssetRoots() {
  const roots = new Map();

  const containsVector = (n) =>
    n.type === 'VECTOR' ||
    n.type === 'BOOLEAN_OPERATION' ||
    (n.children ?? []).some(containsVector);

  const visit = (n, insideAsset) => {
    if (n.visible === false) return;

    // The size cap applies to every node type, not just FRAME. Without it an
    // INSTANCE wrapping a whole section qualifies, and the 1920x138 nav bar
    // gets exported as a single "icon".
    const width = n.absoluteBoundingBox?.width ?? Infinity;
    const isIconish =
      !insideAsset &&
      width <= 260 &&
      containsVector(n) &&
      ['INSTANCE', 'COMPONENT', 'GROUP', 'FRAME'].includes(n.type);

    if (isIconish) {
      const box = n.absoluteBoundingBox;
      const key = `${slug(n.name)}-${n.id.replace(':', '-')}`;
      roots.set(n.id, {
        id: n.id,
        name: n.name,
        file: `${key}.svg`,
        size: box ? `${Math.round(box.width)}x${Math.round(box.height)}` : '?',
      });
      // Do not descend: the parent is the asset.
      for (const c of n.children ?? []) visit(c, true);
      return;
    }

    for (const c of n.children ?? []) visit(c, insideAsset);
  };

  visit(doc.document, false);
  return [...roots.values()];
}

const assets = collectAssetRoots();

if (listOnly) {
  console.log(`${assets.length} asset roots would be exported:\n`);
  for (const a of assets) console.log(`  ${a.id.padEnd(14)} ${a.size.padEnd(9)} ${a.file}`);
  process.exit(0);
}

const env = loadEnv();
const token = env.FIGMA_TOKEN;
const fileKey = env.FIGMA_FILE_KEY;

if (!token || !fileKey) {
  console.error(
    [
      'Cannot export SVGs — credentials missing.',
      '',
      '  figma/.env.figma.local is absent or incomplete.',
      '',
      '  1. cp figma/env.figma.example figma/.env.figma.local',
      '  2. Set FIGMA_TOKEN   (Figma -> Settings -> Security -> Personal access tokens,',
      '                        scope "File content: Read")',
      '  3. Set FIGMA_FILE_KEY (from figma.com/design/<FILE_KEY>/<name>)',
      '',
      `Then re-run. ${assets.length} assets are queued — see --list.`,
      'The file is gitignored, so the token is never committed.',
    ].join('\n')
  );
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The images endpoint rate-limits aggressively when asked to rasterise many
 * nodes at once. 429 is retried with exponential backoff rather than treated as
 * fatal — a partial asset export is worse than a slow one, because the missing
 * icons come back as placeholders nobody notices.
 */
async function figmaGet(pathname, attempt = 0) {
  const response = await fetch(`${API}${pathname}`, { headers: { 'X-Figma-Token': token } });

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('retry-after'));

    // Figma returns an account-level images quota as a retry-after measured in
    // DAYS. Sleeping through that is not a retry, it is a hang — so anything
    // beyond a couple of minutes fails immediately with the real reason and the
    // manual route, rather than looking like a stuck export.
    if (Number.isFinite(retryAfter) && retryAfter > 120) {
      const hours = (retryAfter / 3600).toFixed(1);
      throw new Error(
        [
          `Figma images quota exhausted — retry-after is ${retryAfter}s (~${hours} hours).`,
          '',
          'This is an account-level limit on the /images endpoint, not a per-request throttle.',
          'Options, in order of speed:',
          '  1. Export manually from Figma: select the icon frames -> Export -> SVG,',
          '     save into figma/assets/ using the filenames from `--list`.',
          '  2. Use a token from a different Figma account.',
          `  3. Wait ~${hours} hours and re-run this script.`,
        ].join('\n')
      );
    }

    if (attempt < 6) {
      const waitMs =
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * 2 ** attempt;
      console.log(`  rate limited — retrying in ${Math.round(waitMs / 1000)}s`);
      await sleep(waitMs);
      return figmaGet(pathname, attempt + 1);
    }
  }

  if (!response.ok) {
    throw new Error(`Figma API ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/** Small batches keep each request cheap enough to avoid tripping the limiter. */
const CHUNK = 8;
const PAUSE_BETWEEN_BATCHES_MS = 1200;

mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
for (let i = 0; i < assets.length; i += CHUNK) {
  const batch = assets.slice(i, i + CHUNK);
  const ids = batch.map((a) => a.id).join(',');
  const { images, err } = await figmaGet(
    `/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=svg`
  );
  if (err) throw new Error(`Figma reported: ${err}`);

  for (const asset of batch) {
    const url = images?.[asset.id];
    if (!url) {
      console.warn(`  no render returned for ${asset.id} (${asset.name})`);
      continue;
    }
    const svg = await fetch(url).then((r) => r.text());
    writeFileSync(path.join(OUT_DIR, asset.file), svg, 'utf8');
    written++;
    console.log(`  ${asset.file}`);
  }

  if (i + CHUNK < assets.length) await sleep(PAUSE_BETWEEN_BATCHES_MS);
}

console.log(`\nWrote ${written}/${assets.length} SVGs to figma/assets/`);
