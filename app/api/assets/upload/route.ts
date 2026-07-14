import { NextResponse } from "next/server";
import { saveAsset, type AssetKind } from "@/lib/assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml"
]);
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const kindRaw = (form.get("kind") as string) || "upload";
  const tagsRaw = (form.get("tags") as string) || "";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (!ALLOWED_MIMES.has(file.type)) {
    return NextResponse.json(
      { error: `unsupported mime: ${file.type}` },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `file too large (>${MAX_BYTES} bytes)` },
      { status: 400 }
    );
  }
  const kind = (kindRaw === "template" ? "template" : "upload") as AssetKind;
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const buffer = Buffer.from(await file.arrayBuffer());
  const asset = await saveAsset(buffer, {
    kind,
    mime: file.type,
    tags
  });

  return NextResponse.json({ asset });
}
