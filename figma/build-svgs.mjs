/**
 * Builds real SVG assets from Figma path geometry — no /images endpoint.
 *
 * /images is rasterisation and carries a punishing account-level quota (429
 * with retry-after measured in days). /files is a separate quota, and
 * `?geometry=paths` makes it return the actual `fillGeometry` /
 * `strokeGeometry` for every VECTOR node. The icons are therefore reconstructed
 * from vector maths rather than downloaded as pictures — true SVGs, not traced
 * rasters, and no quota on the critical path.
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

const round = (n) => Math.round(n * 10000) / 10000;

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
function solidPaint(paints) {
  const paint = (paints ?? []).find((p) => p.type === 'SOLID' && p.visible !== false);
  return paint ? { color: hex(paint.color), opacity: paint.opacity ?? paint.color.a ?? 1 } : null;
}

/**
 * Figma's `relativeTransform` is a 2x3 affine matrix stored row-major:
 *
 *   [[a, c, tx],
 *    [b, d, ty]]
 *
 * SVG's `matrix(a b c d e f)` is column-major, so the indices transpose.
 * Getting this wrong transposes every rotation in the file.
 */
const IDENTITY = [
  [1, 0, 0],
  [0, 1, 0],
];

function multiply(p, c) {
  return [
    [
      p[0][0] * c[0][0] + p[0][1] * c[1][0],
      p[0][0] * c[0][1] + p[0][1] * c[1][1],
      p[0][0] * c[0][2] + p[0][1] * c[1][2] + p[0][2],
    ],
    [
      p[1][0] * c[0][0] + p[1][1] * c[1][0],
      p[1][0] * c[0][1] + p[1][1] * c[1][1],
      p[1][0] * c[0][2] + p[1][1] * c[1][2] + p[1][2],
    ],
  ];
}

const matrixToSvg = (m) =>
  [m[0][0], m[1][0], m[0][1], m[1][1], m[0][2], m[1][2]].map(round).join(' ');

/**
 * Imported SVGs keep their `<clipPath>` definitions as ordinary nodes — usually
 * a black rect spanning the icon. Painting one covers the artwork with a solid
 * square. Matches the numbered DEFINITION only (`clipPath719`), never the
 * wrapper Figma names "Clip path group", which holds the real artwork.
 */
const isClipDefinition = (n) => /^clip[-_]?path\d+$/i.test((n.name ?? '').trim());

const containsVector = (n) =>
  n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || (n.children ?? []).some(containsVector);

/**
 * Single pass computing every node's ABSOLUTE matrix, and collecting the
 * smallest node that fully contains an icon.
 *
 * Geometry is in each node's own pre-transform space — proven: `Vector 9` has
 * size 9.428 and path extent 11.0 but an absoluteBoundingBox of 13.334, which
 * is exactly 9.428 x sqrt(2), the AABB of a 45-degree rotation. Positioning by
 * bounding-box delta therefore drops every rotation and scale silently, so the
 * accumulated matrix is what gets applied.
 */
function scan() {
  const absolute = new Map();
  const roots = [];

  const visit = (node, parentMatrix, insideAsset) => {
    if (node.visible === false || isClipDefinition(node)) return;

    const matrix = multiply(parentMatrix, node.relativeTransform ?? IDENTITY);
    absolute.set(node, matrix);

    const width = node.absoluteBoundingBox?.width ?? Infinity;
    const isAsset =
      !insideAsset &&
      width <= MAX_ASSET_WIDTH &&
      containsVector(node) &&
      ['INSTANCE', 'COMPONENT', 'GROUP', 'FRAME'].includes(node.type);

    if (isAsset) roots.push(node);

    for (const child of node.children ?? []) visit(child, matrix, insideAsset || isAsset);
  };

  visit(doc, IDENTITY, false);
  return { absolute, roots };
}

const { absolute, roots } = scan();

/** Emits one <path> per geometry entry, in the asset's own coordinate space. */
function pathsFor(node, matrix) {
  const transform = ` transform="matrix(${matrixToSvg(matrix)})"`;
  const out = [];

  // An UNPAINTED node emits nothing. Defaulting to currentColor paints the
  // container's own bounding rect solid, covering the icon it contains.
  // Absence of paint is information, not a gap to fill.
  const fill = solidPaint(node.fills);
  if (fill) {
    for (const geo of node.fillGeometry ?? []) {
      const rule = geo.windingRule === 'EVENODD' ? ' fill-rule="evenodd"' : '';
      const opacity = fill.opacity < 1 ? ` fill-opacity="${round(fill.opacity)}"` : '';
      out.push(`<path d="${geo.path}" fill="${fill.color}"${rule}${opacity}${transform}/>`);
    }
  }

  const stroke = solidPaint(node.strokes);
  if (stroke) {
    for (const geo of node.strokeGeometry ?? []) {
      // strokeGeometry is already an OUTLINED shape, so it is filled with the
      // stroke colour. Using stroke= here would double the rendered weight.
      const opacity = stroke.opacity < 1 ? ` fill-opacity="${round(stroke.opacity)}"` : '';
      out.push(`<path d="${geo.path}" fill="${stroke.color}"${opacity}${transform}/>`);
    }
  }
  return out;
}

function buildSvg(root) {
  const box = root.absoluteBoundingBox;
  if (!box) return null;

  // Shift absolute space so the asset's bounding box starts at the origin.
  const toOrigin = [
    [1, 0, -box.x],
    [0, 1, -box.y],
  ];

  const body = [];
  const walk = (node) => {
    if (node.visible === false || isClipDefinition(node)) return;
    const matrix = absolute.get(node);
    if (matrix) body.push(...pathsFor(node, multiply(toOrigin, matrix)));
    for (const child of node.children ?? []) walk(child);
  };
  walk(root);

  if (body.length === 0) return null;

  const w = round(box.width);
  const h = round(box.height);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" ` +
    `viewBox="0 0 ${w} ${h}" fill="none">\n  ${body.join('\n  ')}\n</svg>\n`
  );
}

mkdirSync(OUT_DIR, { recursive: true });

/** Identical glyphs repeat across frames; dedupe by content, not by node id. */
const byContent = new Map();
const usedNames = new Set();
let skipped = 0;

for (const root of roots) {
  const svg = buildSvg(root);
  if (svg === null) {
    skipped++;
    continue;
  }
  if (byContent.has(svg)) continue;

  const base = slug(root.name) || 'asset';
  let file = `${base}.svg`;
  let n = 2;
  while (usedNames.has(file)) file = `${base}-${n++}.svg`;
  usedNames.add(file);
  byContent.set(svg, file);

  writeFileSync(path.join(OUT_DIR, file), svg, 'utf8');
  const box = root.absoluteBoundingBox;
  console.log(`  ${file.padEnd(40)} ${round(box.width)}x${round(box.height)}`);
}

console.log(`\nWrote ${byContent.size} SVGs to figma/assets/ (${skipped} roots had no geometry)`);
