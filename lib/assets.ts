import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, "data", "assets");
const INDEX_FILE = path.join(ROOT, "data", "assets.json");

export type AssetKind = "upload" | "ai" | "template";

export type Asset = {
  id: string;
  kind: AssetKind;
  filename: string;
  mime: string;
  bytes: number;
  width?: number;
  height?: number;
  prompt?: string;
  tags: string[];
  createdAt: string;
  createdBy?: string;
};

async function ensure() {
  await fs.mkdir(ASSETS_DIR, { recursive: true });
  try {
    await fs.access(INDEX_FILE);
  } catch {
    await fs.writeFile(INDEX_FILE, "[]", "utf8");
  }
}

export async function listAssets(kind?: AssetKind): Promise<Asset[]> {
  await ensure();
  const raw = await fs.readFile(INDEX_FILE, "utf8");
  let list: Asset[] = [];
  try {
    list = JSON.parse(raw);
  } catch {
    list = [];
  }
  if (kind) list = list.filter((a) => a.kind === kind);
  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getAsset(id: string): Promise<Asset | null> {
  const list = await listAssets();
  return list.find((a) => a.id === id) ?? null;
}

export async function readAssetFile(id: string): Promise<{ buffer: Buffer; asset: Asset } | null> {
  const asset = await getAsset(id);
  if (!asset) return null;
  const p = path.join(ASSETS_DIR, asset.filename);
  const buffer = await fs.readFile(p);
  return { buffer, asset };
}

export async function saveAsset(
  data: Buffer,
  meta: Omit<Asset, "id" | "filename" | "bytes" | "createdAt"> & {
    id?: string;
    ext?: string;
  }
): Promise<Asset> {
  await ensure();
  const id =
    meta.id ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14));
  const ext = meta.ext ?? mimeToExt(meta.mime);
  const filename = `${id}.${ext}`;
  await fs.writeFile(path.join(ASSETS_DIR, filename), data);

  const asset: Asset = {
    id,
    kind: meta.kind,
    filename,
    mime: meta.mime,
    bytes: data.byteLength,
    width: meta.width,
    height: meta.height,
    prompt: meta.prompt,
    tags: meta.tags ?? [],
    createdAt: new Date().toISOString(),
    createdBy: meta.createdBy
  };

  const list = await listAssets();
  list.push(asset);
  await fs.writeFile(INDEX_FILE, JSON.stringify(list, null, 2), "utf8");
  return asset;
}

export async function updateAsset(
  id: string,
  patch: Partial<Pick<Asset, "tags" | "kind" | "prompt">>
): Promise<Asset | null> {
  const list = await listAssets();
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch };
  await fs.writeFile(INDEX_FILE, JSON.stringify(list, null, 2), "utf8");
  return list[idx];
}

export async function deleteAsset(id: string): Promise<boolean> {
  const list = await listAssets();
  const target = list.find((a) => a.id === id);
  if (!target) return false;
  const next = list.filter((a) => a.id !== id);
  await fs.writeFile(INDEX_FILE, JSON.stringify(next, null, 2), "utf8");
  try {
    await fs.rm(path.join(ASSETS_DIR, target.filename), { force: true });
  } catch {
    // ignore
  }
  return true;
}

export function assetUrl(id: string) {
  return `/api/assets/${id}/file`;
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    default:
      return "bin";
  }
}
