import { NextResponse } from "next/server";
import { deletePage, getPage, savePage } from "@/lib/storage";
import type { DetailPage } from "@/lib/blocks/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const page = await getPage(id);
  if (!page) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ page });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await getPage(id);
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = (await req.json()) as Partial<DetailPage>;
  const merged: DetailPage = {
    ...existing,
    ...body,
    id,
    updatedAt: new Date().toISOString()
  };
  const saved = await savePage(merged);
  return NextResponse.json({ page: saved });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deletePage(id);
  return NextResponse.json({ ok: true });
}
