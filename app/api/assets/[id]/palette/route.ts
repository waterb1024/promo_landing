import { NextResponse } from "next/server";
import { readAssetFile } from "@/lib/assets";
import { extractPalette } from "@/lib/image-palette";
import { removeWhiteBackground } from "@/lib/image-transparency";

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
  if (result.asset.mime !== "image/png") {
    return NextResponse.json(
      { error: "only PNG supported" },
      { status: 400 }
    );
  }

  // dominant color 는 흰 배경 제거된 상태에서 뽑는 게 정확 (원본에도 near-white 스킵 로직 있지만
  // 강력한 white halo 가 남아있을 수 있음). 실패 시 원본 사용.
  let source: Buffer;
  try {
    source = removeWhiteBackground(result.buffer);
  } catch {
    source = result.buffer;
  }

  const palette = extractPalette(source);
  if (!palette) {
    return NextResponse.json(
      { error: "dominant color extraction failed" },
      { status: 422 }
    );
  }
  return NextResponse.json({ palette });
}
