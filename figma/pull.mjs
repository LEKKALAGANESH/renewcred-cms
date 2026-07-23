#!/usr/bin/env node
// Pulls the Figma file tree, published styles, and frame renders into ./figma/.
// No dependencies — Node 18+ (global fetch).
//
//   node figma/pull.mjs
//
// Credentials come from figma/.env.figma.local (gitignored) or the environment.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const API = 'https://api.figma.com/v1';
const RENDER_BATCH = 20; // keeps request URLs comfortably short

async function loadCredentials() {
  const env = { ...process.env };
  try {
    const raw = await readFile(join(HERE, '.env.figma.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (match) env[match[1]] ??= match[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // No local env file — fall back to the ambient environment.
  }

  const token = env.FIGMA_TOKEN;
  const fileKey = env.FIGMA_FILE_KEY;

  if (!token || !fileKey) {
    throw new Error(
      'Missing credentials. Copy figma/env.figma.example to\n' +
        'figma/.env.figma.local and fill in FIGMA_TOKEN and FIGMA_FILE_KEY.'
    );
  }
  return { token, fileKey };
}

async function figmaGet(path, token) {
  const response = await fetch(`${API}${path}`, { headers: { 'X-Figma-Token': token } });

  if (response.status === 403) {
    throw new Error(
      '403 from Figma. The token is invalid, expired, or lacks the ' +
        '"File content: Read" scope. Generate a new one under Settings -> Security.'
    );
  }
  if (response.status === 404) {
    throw new Error(
      '404 from Figma. The file key is wrong, or the token belongs to an account ' +
        'that cannot see this file. Use the key from YOUR copy of the design.'
    );
  }
  if (!response.ok) {
    throw new Error(`${response.status} from Figma: ${await response.text()}`);
  }
  return response.json();
}

// Top-level frames are the direct children of each canvas (page) in the document.
function collectFrames(document) {
  const frames = [];
  for (const page of document.children ?? []) {
    for (const node of page.children ?? []) {
      if (node.type === 'FRAME' || node.type === 'COMPONENT') {
        frames.push({ id: node.id, name: node.name, page: page.name });
      }
    }
  }
  return frames;
}

function slugify(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'frame'
  );
}

async function download(url, label, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      if (attempt === attempts) {
        console.warn(`  ! download failed for "${label}" (${error.message})`);
        console.warn(`    retry manually: curl -o "${slugify(label)}.png" "${url}"`);
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  return null;
}

async function renderFrames(frames, { token, fileKey }) {
  const outDir = join(HERE, 'frames');
  await mkdir(outDir, { recursive: true });

  let saved = 0;
  for (let i = 0; i < frames.length; i += RENDER_BATCH) {
    const batch = frames.slice(i, i + RENDER_BATCH);
    const ids = batch.map((frame) => frame.id).join(',');
    const { images } = await figmaGet(
      `/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=png&scale=2`,
      token
    );

    for (const frame of batch) {
      const url = images?.[frame.id];
      if (!url) {
        console.warn(`  ! no render returned for "${frame.name}"`);
        continue;
      }
      // Renders are served from S3, which some proxied networks reject on the
      // first attempt where the api.figma.com call itself succeeded.
      const png = await download(url, frame.name);
      if (!png) continue;

      const file = `${slugify(frame.name)}-${frame.id.replace(':', '-')}.png`;
      await writeFile(join(outDir, file), png);
      saved += 1;
      console.log(`  + ${file}`);
    }
  }
  return saved;
}

async function main() {
  const { token, fileKey } = await loadCredentials();

  console.log('Fetching file tree...');
  const file = await figmaGet(`/files/${fileKey}`, token);
  await writeFile(join(HERE, 'file.json'), JSON.stringify(file, null, 2));
  console.log(`  saved figma/file.json  ("${file.name}")`);

  console.log('Fetching published styles...');
  const styles = await figmaGet(`/files/${fileKey}/styles`, token);
  await writeFile(join(HERE, 'styles.json'), JSON.stringify(styles, null, 2));
  const styleCount = styles.meta?.styles?.length ?? 0;
  console.log(`  saved figma/styles.json  (${styleCount} published styles)`);

  // Written before rendering so a network failure downstream cannot lose the
  // inventory — file.json and frames.json are the artifacts that actually matter.
  const frames = collectFrames(file.document);
  await writeFile(join(HERE, 'frames.json'), JSON.stringify(frames, null, 2));
  console.log(`  saved figma/frames.json  (${frames.length} frames)`);

  console.log(`Rendering ${frames.length} top-level frames...`);
  let saved = 0;
  try {
    saved = await renderFrames(frames, { token, fileKey });
  } catch (error) {
    console.warn(`  ! rendering aborted: ${error.message}`);
    console.warn('    file.json is still valid — renders are reference only.');
  }

  console.log(`\nDone. file.json + styles.json + ${saved} PNGs in figma/frames/.`);
  if (styleCount === 0) {
    console.log(
      'Note: this file publishes no shared styles, so design tokens must be derived\n' +
        'from the node tree in file.json rather than read from styles.json.'
    );
  }
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
