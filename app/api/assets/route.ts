import { NextResponse } from "next/server";
import { listAssets, type AssetKind } from "@/lib/assets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") as AssetKind | null;
  const tag = url.searchParams.get("tag");
  let assets = await listAssets(kind ?? undefined);
  if (tag) assets = assets.filter((a) => a.tags.includes(tag));
  return NextResponse.json({ assets });
}
