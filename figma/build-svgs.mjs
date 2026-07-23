/**
 * Builds real SVG assets from Figma path geometry — no /images endpoint.
 *
 * The /images endpoint is rasterisation and carries a punishing account-level
 * quota (429 with retry-after measured in days). The /files endpoint is a
 * different quota entirely, and `?geometry=paths` makes it return the actual
 * `fillGeometry` / `strokeGeometry` path data for every VECTOR node. So the
 * icons are reconstructed here from vector maths rather than downloaded as
 * pictures — which also means they are true SVGs, not traced rasters.
 *
 *   node figma/pull-geometry.mjs   # refresh figma/file-geometry.json
 *   node figma/build-svgs.mjs      # -> figma/assets/*.svg
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(HERE, 'assets');
const MAX_ASSET_WIDTH = 260;

const doc = JSON.parse(readFileSync(path.join(HERE, 'file-geometry.json'), 'utf8')).document;

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

const hex = (c) =>
  '#' +
  [c.r, c.g, c.b]
    .map((v) =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('');

/** Solid paint, or null when the node is unpainted or uses a gradient. */
function solid(paints) {
  const paint = (paints ?? []).find((p) => p.type === 'SOLID' && p.visible !== false);
  return paint ? { color: hex(paint.color), opacity: paint.opacity ?? paint.color.a ?? 1 } : null;
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Emits one <path> per geometry entry.
 *
 * Figma gives geometry in the node's own coordinate space, so each node is
 * translated by its offset from the asset root. `windingRule` matters: dropping
 * it fills the counters of letterforms solid, which is how a wordmark turns
 * into a blob.
 */
function paths(node, root) {
  const nb = node.absoluteBoundingBox;
  const rb = root.absoluteBoundingBox;
  if (!nb || !rb) return [];

  const dx = nb.x - rb.x;
  const dy = nb.y - rb.y;
  const transform = dx !== 0 || dy !== 0 ? ` transform="translate(${round(dx)} ${round(dy)})"` : '';

  const out = [];

  // An UNPAINTED node emits nothing. Defaulting to currentColor paints the
  // container's own bounding rect solid — which covers the icon it contains
  // with a filled square. Absence of paint is information, not a gap to fill.
  const fill = solid(node.fills);
  if (fill) {
    for (const geo of node.fillGeometry ?? []) {
      const rule = geo.windingRule === 'EVENODD' ? ' fill-rule="evenodd"' : '';
      const opacity = fill.opacity < 1 ? ` fill-opacity="${round(fill.opacity)}"` : '';
      out.push(`<path d="${geo.path}" fill="${fill.color}"${rule}${opacity}${transform}/>`);
    }
  }

  const stroke = solid(node.strokes);
  if (stroke) {
    for (const geo of node.strokeGeometry ?? []) {
      // Figma's strokeGeometry is already an outlined shape, so it is FILLED
      // with the stroke colour. Using stroke= would double the weight.
      const opacity = stroke.opacity < 1 ? ` fill-opacity="${round(stroke.opacity)}"` : '';
      out.push(`<path d="${geo.path}" fill="${stroke.color}"${opacity}${transform}/>`);
    }
  }
  return out;
}

const round = (n) => Math.round(n * 100) / 100;

/**
 * SVGs imported into Figma keep their `<clipPath>` definitions as ordinary
 * nodes named `clipPath<n>`, usually a black rect spanning the whole icon.
 * Those define a clip region — they are not artwork. Painting them covers the
 * icon with a solid black square, which is exactly what happened to the
 * Biochar, Methane, and Renewable Energy icons.
 */
// Matches the DEFINITION node only — `clipPath719` — and deliberately not the
// wrapper Figma names "Clip path group", which holds the real artwork. Skipping
// the wrapper drops the whole icon.
const isClipDefinition = (n) => /^clip[-_]?path\d+$/i.test(n.name.trim());

function collect(node, root, acc) {
  if (node.visible === false || isClipDefinition(node)) return;
  acc.push(...paths(node, root));
  for (const child of node.children ?? []) collect(child, root, acc);
}

const containsVector = (n) =>
  n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || (n.children ?? []).some(containsVector);

/** The smallest node fully containing an icon — never one file per path. */
function assetRoots() {
  const roots = [];
  const visit = (n, inside) => {
    if (n.visible === false) return;
    const width = n.absoluteBoundingBox?.width ?? Infinity;
    const isAsset =
      !inside &&
      width <= MAX_ASSET_WIDTH &&
      containsVector(n) &&
      ['INSTANCE', 'COMPONENT', 'GROUP', 'FRAME'].includes(n.type);

    if (isAsset) {
      roots.push(n);
      for (const c of n.children ?? []) visit(c, true);
      return;
    }
    for (const c of n.children ?? []) visit(c, inside);
  };
  visit(doc, false);
  return roots;
}

mkdirSync(OUT_DIR, { recursive: true });

const written = new Map();
let skipped = 0;

for (const root of assetRoots()) {
  const box = root.absoluteBoundingBox;
  if (!box) continue;

  const body = [];
  collect(root, root, body);
  if (body.length === 0) {
    skipped++;
    continue;
  }

  const w = round(box.width);
  const h = round(box.height);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" ` +
    `viewBox="0 0 ${w} ${h}" fill="none">\n  ${body.join('\n  ')}\n</svg>\n`;

  // Identical icons repeat across frames; deduplicate by content so the same
  // glyph is not written four times under four node ids.
  const name = `${slug(root.name)}.svg`;
  const key = svg;
  if (written.has(key)) continue;
  written.set(key, name);

  let file = name;
  let n = 2;
  while ([...written.values()].filter((v) => v === file).length > 1)
    file = `${slug(root.name)}-${n++}.svg`;
  written.set(key, file);

  writeFileSync(path.join(OUT_DIR, file), svg, 'utf8');
  console.log(`  ${file.padEnd(44)} ${w}x${h}  ${escape(root.name)}`);
}

console.log(
  `\nWrote ${written.size} SVGs to figma/assets/ (${skipped} roots had no paintable geometry)`
);
