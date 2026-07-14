import { NextResponse } from "next/server";
import { deleteAsset, updateAsset } from "@/lib/assets";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await deleteAsset(id);
  return NextResponse.json({ ok });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const asset = await updateAsset(id, {
    tags: body.tags,
    kind: body.kind,
    prompt: body.prompt
  });
  if (!asset) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ asset });
}
