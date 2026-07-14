// PNG export naming rules — ported from promo-automation helper/main.py
// See ~/Desktop/workspaces/work_promo-automation/README.md#프레임-이름-규칙
//
// 랜딩 규칙: {MMDD}_landing_{promotion}_{width}
//   예: 0518_landing_summersale_1080

export function mmdd(d: Date = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}${dd}`;
}

// Matches promo-automation SAFE_FILENAME_RE character class: [\w가-힣\-.# ]
// (word chars incl. underscore, Korean syllables, hyphen, dot, hash, space)
// Anything outside → underscore.
export function promotionSlug(input: string): string {
  const trimmed = (input || "").trim();
  if (!trimmed) return "page";
  const cleaned = trimmed
    .replace(/[^\w가-힣\-.# ]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || "page";
}

export function landingBaseName(params: {
  promotion: string;
  width: number;
  date?: Date;
}): string {
  const { promotion, width, date } = params;
  return `${mmdd(date)}_landing_${promotionSlug(promotion)}_${width}`;
}

export function blockImgName(index0: number): string {
  const n = String(index0 + 1).padStart(2, "0");
  return `img_${n}.png`;
}
