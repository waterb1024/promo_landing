import { NextResponse } from "next/server";
import { saveAsset } from "@/lib/assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const HELPER = process.env.PROMO_HELPER_URL ?? "http://127.0.0.1:7000";

type HelperGenerateReq = {
  texts?: string[];
  width: number;
  height: number;
  kind?: string;
  extra_hint?: string;
  style?: string;
  subject?: string;
  prompt_template?: string;
  transparent_background?: boolean;
  emphasize_numbers?: boolean;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<HelperGenerateReq> & {
    tags?: string[];
  };

  const width = Number(body.width) || 1024;
  const height = Number(body.height) || 1024;

  const helperBody: HelperGenerateReq = {
    texts: body.texts ?? [],
    subject: body.subject,
    width,
    height,
    kind: body.kind ?? "popup",
    style: body.style ?? "illustration",
    extra_hint: body.extra_hint,
    prompt_template: body.prompt_template,
    transparent_background: body.transparent_background ?? false,
    emphasize_numbers: body.emphasize_numbers ?? false
  };

  const postRes = await fetch(`${HELPER}/generate-image`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(helperBody)
  });
  if (!postRes.ok) {
    const text = await postRes.text();
    return NextResponse.json(
      { error: `helper ${postRes.status}: ${text.slice(0, 300)}` },
      { status: 502 }
    );
  }
  const { job_id } = (await postRes.json()) as { job_id: string };

  const started = Date.now();
  const deadline = started + 110_000;
  let finalPrompt: string | undefined;
  while (Date.now() < deadline) {
    const s = await fetch(`${HELPER}/generate-image/${job_id}`);
    if (!s.ok) break;
    const j = (await s.json()) as {
      status: string;
      stage?: string;
      prompt?: string;
      image_base64?: string;
      size?: string;
      error?: string;
    };
    if (j.prompt) finalPrompt = j.prompt;
    if (j.status === "completed" && j.image_base64) {
      const buf = Buffer.from(j.image_base64, "base64");
      const asset = await saveAsset(buf, {
        kind: "ai",
        mime: "image/png",
        prompt: finalPrompt ?? j.prompt,
        tags: body.tags ?? [],
        width,
        height
      });
      return NextResponse.json({ asset, prompt: finalPrompt });
    }
    if (j.status === "failed") {
      return NextResponse.json(
        { error: j.error ?? "helper failed" },
        { status: 500 }
      );
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  return NextResponse.json({ error: "helper timeout" }, { status: 504 });
}
