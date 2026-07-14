import fs from "node:fs/promises";
import path from "node:path";
import type { DetailPage } from "./blocks/types";

const DATA_DIR = path.join(process.cwd(), "data", "pages");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function listPages(): Promise<DetailPage[]> {
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const pages: DetailPage[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, f), "utf8");
      pages.push(JSON.parse(raw));
    } catch {
      // skip
    }
  }
  return pages.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function getPage(id: string): Promise<DetailPage | null> {
  await ensureDir();
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function savePage(page: DetailPage): Promise<DetailPage> {
  await ensureDir();
  const next = { ...page, updatedAt: new Date().toISOString() };
  await fs.writeFile(
    path.join(DATA_DIR, `${next.id}.json`),
    JSON.stringify(next, null, 2),
    "utf8"
  );
  return next;
}

export async function deletePage(id: string): Promise<void> {
  await ensureDir();
  await fs.rm(path.join(DATA_DIR, `${id}.json`), { force: true });
}
