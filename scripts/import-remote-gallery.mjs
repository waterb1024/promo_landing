#!/usr/bin/env node
// Import favorite images from remote gallery into Landing CMS asset library.
// Usage: node scripts/import-remote-gallery.mjs [--all|--3d|--2d|--favorites]

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const REMOTE = process.env.GALLERY_URL;
if (!REMOTE) {
  console.error("GALLERY_URL 환경변수가 필요합니다. 예: GALLERY_URL=http://.../ npm run gallery:import");
  process.exit(1);
}
const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, "data", "assets");
const INDEX_FILE = path.join(ROOT, "data", "assets.json");

const arg = process.argv[2] || "--favorites";

const EXT_TO_MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml"
};

const stopwords = new Set([
  "and", "or", "the", "a", "an", "of", "with", "for", "to", "in", "on"
]);

function tokenize(subject) {
  return subject
    .toLowerCase()
    .split(/[\s,·\-_/()·]+/)
    .map((t) => t.trim())
    .filter((t) => t && !stopwords.has(t))
    .slice(0, 8);
}

async function readIndex() {
  try {
    const raw = await readFile(INDEX_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function ensureDirs() {
  await mkdir(ASSETS_DIR, { recursive: true });
  try {
    await access(INDEX_FILE);
  } catch {
    await writeFile(INDEX_FILE, "[]", "utf8");
  }
}

function newId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

async function main() {
  await ensureDirs();

  const listRes = await fetch(`${REMOTE}/api/images`);
  if (!listRes.ok) throw new Error(`list ${listRes.status}`);
  const all = await listRes.json();
  let filtered;
  switch (arg) {
    case "--all":
      filtered = all;
      break;
    case "--3d":
      filtered = all.filter((x) => x.view === "3d");
      break;
    case "--2d":
      filtered = all.filter((x) => x.view === "2d");
      break;
    case "--favorites":
    default:
      filtered = all.filter((x) => x.favorite === true);
  }

  console.log(`remote total=${all.length}, importing=${filtered.length}, mode=${arg}`);

  const index = await readIndex();
  const seenPrompts = new Set(
    index.filter((a) => a.prompt).map((a) => a.prompt)
  );
  const seenTagKeys = new Set(
    index.map((a) => a.tags?.join("|") ?? "")
  );

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of filtered) {
    const url = `${REMOTE}${item.url}`;
    const ext = (item.ext || "png").toLowerCase();
    const mime = EXT_TO_MIME[ext] || "image/png";
    const tags = [item.view, ...tokenize(item.subject)].filter(Boolean);

    // dedupe by prompt (each remote image has a unique prompt)
    if (item.prompt && seenPrompts.has(item.prompt)) {
      skipped++;
      continue;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`  fail ${res.status} ${url}`);
        failed++;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const id = newId();
      const filename = `${id}.${ext}`;
      await writeFile(path.join(ASSETS_DIR, filename), buf);
      const asset = {
        id,
        kind: "ai",
        filename,
        mime,
        bytes: buf.byteLength,
        prompt: item.prompt,
        tags,
        createdAt: new Date(item.ts || Date.now()).toISOString(),
        createdBy: "remote-gallery-import"
      };
      index.push(asset);
      if (item.prompt) seenPrompts.add(item.prompt);
      added++;
      if (added % 10 === 0) console.log(`  ${added} imported…`);
    } catch (err) {
      console.warn(`  err ${item.name}: ${err.message}`);
      failed++;
    }
  }

  await writeFile(INDEX_FILE, JSON.stringify(index, null, 2), "utf8");
  console.log(`done: +${added}, skipped ${skipped} (dup), failed ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
