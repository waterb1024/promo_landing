import { NextResponse } from "next/server";
import { listPages, savePage } from "@/lib/storage";
import type { DetailPage } from "@/lib/blocks/types";

export async function GET() {
  const pages = await listPages();
  return NextResponse.json({ pages });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<DetailPage>;
  if (!body.id || !body.title) {
    return NextResponse.json({ error: "id, title required" }, { status: 400 });
  }
  const page: DetailPage = {
    id: body.id,
    title: body.title,
    service: body.service ?? "",
    templateVariant: body.templateVariant,
    status: body.status ?? "draft",
    blocks: body.blocks ?? [],
    updatedAt: new Date().toISOString(),
    updatedBy: body.updatedBy
  };
  const saved = await savePage(page);
  return NextResponse.json({ page: saved });
}
