import { NextResponse } from "next/server";
import { readAssetFile } from "@/lib/assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await readAssetFile(id);
  if (!result) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "content-type": result.asset.mime,
      "cache-control": "private, max-age=60"
    }
  });
}
