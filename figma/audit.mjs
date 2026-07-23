/**
 * Figma reverse-engineering audit.
 *
 * Produces the node inventory that must exist BEFORE implementation, and the
 * coverage matrix that tracks every node to a verified UI element.
 *
 * Precedence when artifacts disagree — the PNG is the actual visual output, so
 * it wins:
 *
 *   frames/*.png  >  file.json  >  styles.json  >  design-tokens.json
 *
 * The extract is last because it is a lossy summary: it captured family, size
 * and weight but not fontPostScriptName, italic, or textDecoration, which is
 * how an italic display title shipped upright.
 *
 *   node figma/audit.mjs            # human-readable inventory
 *   node figma/audit.mjs --json     # machine-readable, for the coverage matrix
 */
import { readFileSync } from 'node:fs';

const doc = JSON.parse(readFileSync(new URL('./file.json', import.meta.url), 'utf8'));
const asJson = process.argv.includes('--json');

const hex = (c) =>
  c
    ? '#' +
      [c.r, c.g, c.b]
        .map((v) =>
          Math.round(v * 255)
            .toString(16)
            .padStart(2, '0')
        )
        .join('')
    : null;

const frames = doc.document.children
  .flatMap((page) => (page.children ?? []).map((f) => ({ page: page.name, frame: f })))
  .filter(({ frame }) => frame.absoluteBoundingBox?.width === 1920);

/** Every leaf that paints pixels. A frame with no fill and no stroke paints nothing. */
function paintsPixels(n) {
  const visibleFill = (n.fills ?? []).some((f) => f.visible !== false && f.opacity !== 0);
  const visibleStroke = (n.strokes ?? []).some((s) => s.visible !== false);
  const hasEffect = (n.effects ?? []).some((e) => e.visible !== false);
  return n.type === 'TEXT' || visibleFill || visibleStroke || hasEffect;
}

function inventory(frame) {
  const nodes = { text: [], vector: [], image: [], instance: [], container: [], effect: [] };
  const typography = new Map();
  const fills = new Map();
  const strokes = new Map();
  const radii = new Map();
  const spacing = new Map();

  const bump = (map, key, sample) => {
    if (!map.has(key)) map.set(key, { key, count: 0, sample });
    map.get(key).count++;
  };

  const walk = (n, path) => {
    if (n.visible === false) return;
    const here = `${path} > ${n.name}`;
    const box = n.absoluteBoundingBox;

    if (n.type === 'TEXT' && n.style) {
      const s = n.style;
      // fontPostScriptName is the only field that reveals italic; family+weight
      // cannot distinguish WorkSans-Medium from WorkSans-MediumItalic.
      const key = [
        s.fontPostScriptName ?? `${s.fontFamily}-${s.fontWeight}`,
        `${s.fontSize}/${s.lineHeightPx ?? '?'}`,
        s.italic ? 'italic' : 'upright',
        s.textDecoration ?? 'none',
        `ls=${s.letterSpacing ?? 0}`,
        `align=${s.textAlignHorizontal ?? 'LEFT'}`,
      ].join(' · ');
      bump(typography, key, n.characters.slice(0, 40));
      nodes.text.push({ id: n.id, name: n.name, path: here, text: n.characters, style: key, box });
    }

    if (
      n.type === 'VECTOR' ||
      n.type === 'BOOLEAN_OPERATION' ||
      n.type === 'STAR' ||
      n.type === 'ELLIPSE'
    ) {
      nodes.vector.push({ id: n.id, name: n.name, path: here, box });
    }
    if ((n.fills ?? []).some((f) => f.type === 'IMAGE')) {
      nodes.image.push({ id: n.id, name: n.name, path: here, box });
    }
    if (n.type === 'INSTANCE' || n.type === 'COMPONENT') {
      nodes.instance.push({ id: n.id, name: n.name, componentId: n.componentId, path: here, box });
    }
    if (n.type === 'FRAME' || n.type === 'GROUP') {
      nodes.container.push({ id: n.id, name: n.name, path: here, box });
    }

    for (const f of n.fills ?? []) {
      if (f.type === 'SOLID' && f.visible !== false) bump(fills, hex(f.color), n.name);
    }
    for (const s of n.strokes ?? []) {
      if (s.type === 'SOLID' && s.visible !== false) {
        bump(strokes, `${hex(s.color)} @ ${n.strokeWeight ?? 1}px`, n.name);
      }
    }
    for (const e of n.effects ?? []) {
      if (e.visible === false) continue;
      const key = `${e.type} r=${e.radius ?? 0} off=${e.offset ? `${e.offset.x},${e.offset.y}` : '-'} ${
        e.color ? `a=${e.color.a.toFixed(2)}` : ''
      }`;
      bump(effectMap, key, n.name);
      nodes.effect.push({ id: n.id, name: n.name, path: here, effect: key });
    }
    if (n.cornerRadius) bump(radii, String(n.cornerRadius), n.name);
    if (Array.isArray(n.rectangleCornerRadii)) bump(radii, `[${n.rectangleCornerRadii}]`, n.name);
    if (n.itemSpacing) bump(spacing, `gap ${n.itemSpacing}`, n.name);
    for (const [side, v] of [
      ['pt', n.paddingTop],
      ['pr', n.paddingRight],
      ['pb', n.paddingBottom],
      ['pl', n.paddingLeft],
    ]) {
      if (v) bump(spacing, `${side} ${v}`, n.name);
    }

    if (paintsPixels(n) && box) pixelBearing.push({ id: n.id, name: n.name, type: n.type, box });

    for (const child of n.children ?? []) walk(child, here);
  };

  const effectMap = new Map();
  const pixelBearing = [];
  walk(frame, '');

  const sorted = (m) => [...m.values()].sort((a, b) => b.count - a.count);
  return {
    name: frame.name,
    id: frame.id,
    size: `${Math.round(frame.absoluteBoundingBox.width)}x${Math.round(frame.absoluteBoundingBox.height)}`,
    counts: {
      text: nodes.text.length,
      vector: nodes.vector.length,
      image: nodes.image.length,
      instance: nodes.instance.length,
      container: nodes.container.length,
      pixelBearing: pixelBearing.length,
    },
    typography: sorted(typography),
    fills: sorted(fills),
    strokes: sorted(strokes),
    effects: sorted(effectMap),
    radii: sorted(radii),
    spacing: sorted(spacing),
    nodes,
    pixelBearing,
  };
}

const report = frames.map(({ page, frame }) => ({ page, ...inventory(frame) }));

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const f of report) {
    console.log(`\n=== ${f.name} (${f.id}) ${f.size} — page "${f.page}"`);
    console.log(
      `    nodes: ${f.counts.pixelBearing} pixel-bearing · ${f.counts.text} text · ` +
        `${f.counts.vector} vector · ${f.counts.image} image · ${f.counts.instance} instance`
    );
    console.log(`    typography (${f.typography.length} distinct):`);
    for (const t of f.typography) console.log(`      ${String(t.count).padStart(4)}x  ${t.key}`);
    console.log(`    strokes (${f.strokes.length}):`);
    for (const s of f.strokes) console.log(`      ${String(s.count).padStart(4)}x  ${s.key}`);
    console.log(`    effects (${f.effects.length}):`);
    for (const e of f.effects) console.log(`      ${String(e.count).padStart(4)}x  ${e.key}`);
    console.log(`    radii: ${f.radii.map((r) => `${r.key}(${r.count})`).join(' ')}`);
  }

  // Frames are compared by full node signature, never by child count — the
  // depth-2 comparison that produced the false "duplicate frames" conclusion.
  console.log('\n=== FRAME EQUIVALENCE (full signature, not child count)');
  const signature = (f) =>
    JSON.stringify({
      text: f.nodes.text.map((t) => `${t.text}|${t.style}`).sort(),
      vectors: f.counts.vector,
      instances: f.nodes.instance.map((i) => i.name).sort(),
    });
  const groups = new Map();
  for (const f of report) {
    const sig = signature(f);
    if (!groups.has(sig)) groups.set(sig, []);
    groups.get(sig).push(f.name + ' ' + f.id);
  }
  console.log(`    ${report.length} frames -> ${groups.size} distinct`);
  [...groups.values()].forEach((g, i) => console.log(`      group ${i + 1}: ${g.join(' , ')}`));
}
