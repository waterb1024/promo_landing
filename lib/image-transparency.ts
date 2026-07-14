// PNG 흰 배경 자동 투명화.
// Port of ~/.promo-automation/helper-src/main.py:746 `_remove_white_background`
//
// 알고리즘:
// 1) 코너 4개 + 변 중앙 4개 총 8개 seed 에서 floodfill 로 연결된 near-white 영역 → alpha 0
//    thresh(32) 만큼 관대하게 (RGB min >= 255-thresh 이면 near-white)
// 2) 남은 near-white 픽셀 alpha 를 min(R,G,B) 값에 따라 선형 감쇠 (soften=40 범위)
//    → anti-alias edge 의 흰 halo/fringe 부드럽게 제거
// 3) 오브젝트 안쪽 흰색은 배경과 연결돼 있지 않아 유지됨

import { PNG } from "pngjs";

export function removeWhiteBackground(
  buffer: Buffer,
  thresh = 32,
  soften = 40
): Buffer {
  const png = PNG.sync.read(buffer);
  const { width: w, height: h, data } = png;

  const idx = (x: number, y: number) => (y * w + x) * 4;

  const isNearWhite = (x: number, y: number): boolean => {
    if (x < 0 || x >= w || y < 0 || y >= h) return false;
    const i = idx(x, y);
    const a = data[i + 3];
    if (a === 0) return false; // already transparent
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    return Math.min(r, g, b) >= 255 - thresh;
  };

  // BFS floodfill — stack-safe for large images
  const visited = new Uint8Array(w * h);
  const flood = (sx: number, sy: number) => {
    if (!isNearWhite(sx, sy)) return;
    const stack: number[] = [sy * w + sx];
    while (stack.length > 0) {
      const p = stack.pop()!;
      if (visited[p]) continue;
      const x = p % w;
      const y = Math.floor(p / w);
      if (!isNearWhite(x, y)) continue;
      visited[p] = 1;
      data[idx(x, y) + 3] = 0;
      if (x + 1 < w && !visited[p + 1]) stack.push(p + 1);
      if (x - 1 >= 0 && !visited[p - 1]) stack.push(p - 1);
      if (y + 1 < h && !visited[p + w]) stack.push(p + w);
      if (y - 1 >= 0 && !visited[p - w]) stack.push(p - w);
    }
  };

  const seeds: Array<[number, number]> = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
    [Math.floor(w / 2), 0],
    [Math.floor(w / 2), h - 1],
    [0, Math.floor(h / 2)],
    [w - 1, Math.floor(h / 2)]
  ];
  for (const [sx, sy] of seeds) flood(sx, sy);

  // 2) anti-alias fringe alpha 감쇠
  if (soften > 0) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = idx(x, y);
        const a = data[i + 3];
        if (a === 0) continue;
        const rgbMin = Math.min(data[i], data[i + 1], data[i + 2]);
        if (rgbMin > 255 - soften) {
          const mult = Math.round((255 * (255 - rgbMin)) / soften);
          const newA = Math.round((a * mult) / 255);
          data[i + 3] = newA;
        }
      }
    }
  }

  return PNG.sync.write(png);
}
