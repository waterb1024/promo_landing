// PNG 에서 dominant color 를 추출해 파스텔·엑센트 hex 팔레트로 변환.
// Port of ~/.promo-automation/helper-src/main.py:
//   1230 _extract_dominant_color_pastel  — dominant → HSL L clamp [0.87, 0.93]
//   1204 _derive_button_from_pastel      — hue 유지 + L=0.50 S≥0.55 로 강한 엑센트

import { PNG } from "pngjs";

const PASTEL_L_MIN = 0.87;
const PASTEL_L_MAX = 0.93;
const ACCENT_L_TARGET = 0.5;
const ACCENT_S_MIN = 0.55;

export type ImagePalette = {
  pastel: string; // 파스텔 배경용 hex (예: hero.bg)
  accent: string; // 강한 엑센트용 hex (예: hero.labelBg)
};

export function extractPalette(buffer: Buffer): ImagePalette | null {
  const dom = extractDominant(buffer);
  if (!dom) return null;
  const [h, s, l] = rgbToHsl(dom.r / 255, dom.g / 255, dom.b / 255);

  // 파스텔: hue·saturation 유지, L 은 [0.87, 0.93] 로 clamp
  const pastelL = Math.max(PASTEL_L_MIN, Math.min(PASTEL_L_MAX, l));
  const pastel = hslToHex(h, s, pastelL);

  // 엑센트: hue 유지, S 는 s_min 보장, L 은 target 로 낮춤
  const accentS = Math.max(ACCENT_S_MIN, s);
  const accent = hslToHex(h, accentS, ACCENT_L_TARGET);

  return { pastel, accent };
}

function extractDominant(
  buffer: Buffer
): { r: number; g: number; b: number } | null {
  const png = PNG.sync.read(buffer);
  const { width, height, data } = png;

  // 다운샘플 — 최대 변이 64 픽셀이 되도록 step 계산
  const step = Math.max(1, Math.floor(Math.max(width, height) / 64));

  // 32-step bucketing (8 buckets per channel = 512 total)
  // near-white / 반투명 픽셀은 제외 (배경 잡음)
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a < 200) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (Math.min(r, g, b) >= 240) continue; // near-white 스킵
      if (Math.max(r, g, b) <= 15) continue; // near-black 도 스킵 (텍스트 라벨 노이즈)
      const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
      const cur = buckets.get(key);
      if (cur) {
        cur.r += r;
        cur.g += g;
        cur.b += b;
        cur.n += 1;
      } else {
        buckets.set(key, { r, g, b, n: 1 });
      }
    }
  }
  if (buckets.size === 0) return null;

  let best: { r: number; g: number; b: number; n: number } | null = null;
  for (const b of buckets.values()) {
    if (!best || b.n > best.n) best = b;
  }
  if (!best) return null;

  return {
    r: Math.round(best.r / best.n),
    g: Math.round(best.g / best.n),
    b: Math.round(best.b / best.n)
  };
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function toHex(v: number): string {
  const n = Math.max(0, Math.min(255, Math.round(v * 255)));
  return n.toString(16).padStart(2, "0");
}
