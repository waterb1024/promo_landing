import { NextResponse } from "next/server";
import JSZip from "jszip";
import { chromium } from "playwright";
import { getPage } from "@/lib/storage";
import {
  blockImgName,
  landingBaseName,
  promotionSlug
} from "@/lib/export-naming";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const RENDER_WIDTH = 1080;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const page = await getPage(id);
  if (!page) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const wantPng = url.searchParams.get("format") === "png";
  const promotion = promotionSlug(page.service || page.title || page.id);
  const baseName = landingBaseName({ promotion, width: RENDER_WIDTH });

  const origin = url.origin;
  const target = `${origin}/render/${id}?export=1`;

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: RENDER_WIDTH, height: 800 },
      deviceScaleFactor: 1
    });
    const bpage = await context.newPage();
    await bpage.goto(target, { waitUntil: "domcontentloaded", timeout: 30000 });

    const container = bpage.locator("[data-render-container]").first();
    await container.waitFor({ state: "visible", timeout: 15000 });

    await bpage.evaluate(() =>
      Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise<void>((resolve) => {
                img.addEventListener("load", () => resolve(), { once: true });
                img.addEventListener("error", () => resolve(), { once: true });
              })
          )
      )
    );
    await bpage
      .evaluate(() =>
        (document as unknown as { fonts?: { ready: Promise<void> } }).fonts
          ?.ready
      )
      .catch(() => undefined);

    const mainBuffer = await container.screenshot({
      type: "png",
      omitBackground: false
    });

    if (wantPng) {
      const asciiName = `${baseName}.png`.replace(/[^\x20-\x7e]/g, "_");
      const encoded = encodeURIComponent(`${baseName}.png`);
      return new NextResponse(new Uint8Array(mainBuffer), {
        status: 200,
        headers: {
          "content-type": "image/png",
          "content-disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encoded}`
        }
      });
    }

    const slots = container.locator("[data-block-slot]");
    const count = await slots.count();
    const blockShots: Array<{ name: string; buffer: Buffer }> = [];
    for (let i = 0; i < count; i++) {
      const slot = slots.nth(i);
      await slot.scrollIntoViewIfNeeded();
      const buf = await slot.screenshot({ type: "png", omitBackground: false });
      blockShots.push({ name: blockImgName(i), buffer: buf });
    }

    const zip = new JSZip();
    const folder = zip.folder(baseName);
    if (!folder) throw new Error("failed to init zip folder");
    folder.file(`${baseName}.png`, mainBuffer);
    for (const shot of blockShots) {
      folder.file(shot.name, shot.buffer);
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
      platform: "UNIX"
    });

    const zipName = `${baseName}.zip`;
    const asciiZip = zipName.replace(/[^\x20-\x7e]/g, "_");
    const encoded = encodeURIComponent(zipName);
    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${asciiZip}"; filename*=UTF-8''${encoded}`
      }
    });
  } finally {
    await browser.close();
  }
}
