import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { readAssetFile } from "@/lib/assets";
import { removeWhiteBackground } from "@/lib/image-transparency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, "data", "assets");

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const wantTransparent = url.searchParams.get("transparent") === "1";

  const result = await readAssetFile(id);
  if (!result) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // transparent 요청이지만 PNG 가 아니면 원본 반환 (JPG/GIF 등은 무시)
  const isPng = result.asset.mime === "image/png";
  if (!wantTransparent || !isPng) {
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "content-type": result.asset.mime,
        "cache-control": "private, max-age=60"
      }
    });
  }

  // 캐시된 투명 버전 확인
  const cachePath = path.join(ASSETS_DIR, `${id}.transparent.png`);
  try {
    const cached = await fs.readFile(cachePath);
    return new NextResponse(new Uint8Array(cached), {
      status: 200,
      headers: {
        "content-type": "image/png",
        "cache-control": "private, max-age=300",
        "x-transparent-cache": "hit"
      }
    });
  } catch {
    // 캐시 없음 — 생성
  }

  let processed: Buffer;
  try {
    processed = removeWhiteBackground(result.buffer);
  } catch {
    // 변환 실패 시 원본
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "content-type": "image/png",
        "cache-control": "private, max-age=60",
        "x-transparent-cache": "error"
      }
    });
  }

  // 캐시 저장 (동시 요청 시 마지막 write 가 남음 — 결과 동일하므로 안전)
  fs.writeFile(cachePath, processed).catch(() => undefined);

  return new NextResponse(new Uint8Array(processed), {
    status: 200,
    headers: {
      "content-type": "image/png",
      "cache-control": "private, max-age=300",
      "x-transparent-cache": "miss"
    }
  });
}
