---
description: Figma 프레임 URL 하나로 새 블록 자동 추출 + 스캐폴딩 + 픽셀 스펙 이식
---

# /block-from-figma — Figma URL → Landing CMS 블록 자동 생성

**전제:** Figma MCP (`plugin:figma:figma`) 가 연결되어 있어야 함. 확인: `mcp__plugin_figma_figma__whoami` 로 응답 오면 OK.

**입력 (없으면 물어봐라):**
1. Figma 프레임 URL 또는 node-id (예: `https://figma.com/design/WMYs9JCPzqL6rBFKM94Cx4/...?node-id=59-3`)
2. 블록 슬러그 (snake_case, 예: `guide_step`)
3. 한글 이름
4. 한 줄 설명

---

## Step 1. Figma 스펙 추출

**필수 MCP 호출 3개 — 이 순서로:**

1. `mcp__plugin_figma_figma__get_metadata` — 해당 노드의 계층 구조·바운딩 박스·타입 확보
2. `mcp__plugin_figma_figma__get_design_context` — 폰트·컬러·스페이싱·bindings 획득
3. `mcp__plugin_figma_figma__get_screenshot` — 시각 확인용 (에이전트가 최종 결과 검증 시 참조)

**추출해야 할 값 (이 중 하나라도 못 구하면 사용자에게 확인. 추정 금지):**

| 카테고리 | 확보할 값 |
|---|---|
| 컨테이너 | 배경색, paddingTop/Bottom/Left/Right, minHeight |
| 텍스트 노드마다 | fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, color, whiteSpace(pre-line 여부), align |
| 이미지 슬롯 | 위치·크기 (예: 1080×1000), objectFit (contain/cover) |
| 색상 뱃지 | 배경색, radius, padding, 글자색·크기 |
| 배열/리스트 | 아이템 간 간격 (gap) |

**Figma 변수(variables) 가 있으면 그대로 var 이름을 코멘트에 남겨라.** (`var(--color-primary)` 같은 표기).

## Step 2. 필드 매핑

`lib/blocks/field-schema.ts` 의 `CANONICAL_FIELDS` 에서 이 블록에 필요한 필드를 고른다.

**변경 가능한 값 = 필드로 노출** (예: 라벨 텍스트, 타이틀, 이미지 URL).
**변경 불가 = 코드에 하드코딩** (예: 폰트 크기, 스페이싱, 정렬).

디자이너와 확인 필요한 경계 케이스:
- 배경색: 페이지마다 다르면 `bg` 필드로, 이 블록 타입에 고정이면 하드코딩
- 이미지 크기: 스펙상 고정이면 렌더 컴포넌트에 고정 (`h-[1000px]`)

사전에 **없는** 새 필드가 필요하면 → 사용자에게 확인 후 `field-schema.ts` 에 먼저 추가.

## Step 3. 스캐폴더 실행

`node scripts/new-block.mjs {slug}` 를 대화형으로 실행하지 말고, **직접 4개 파일을 수정**해라 (스캐폴더는 손으로 필드 번호 입력이 필요해서 슬래시 커맨드에서는 부적합). 대신 스캐폴더가 만드는 것과 **동일한 구조**로 4개 파일을 편집:

1. `lib/blocks/types.ts` — 새 `{Pascal}Block` 인터페이스 + 유니온 확장 + `BLOCK_TYPE_META` + `defaultBlock` case
2. `lib/blocks/{slug}/{Pascal}.tsx` — Step 1 에서 뽑은 픽셀 스펙 그대로 이식 (인라인 style, hardcoded 값)
3. `lib/blocks/registry.tsx` — import + switch case
4. `app/admin/pages/[id]/BlockFields.tsx` — 이미 있는 `HeroFields`/`ImageTextFields` 패턴 그대로 복사해서 새 필드 컴포넌트 만들고 switch case 추가

`<section data-block-type="{slug}" className="w-full">` 로 감싸는 것 필수 (ZIP export 마커).

## Step 4. 검증

```bash
npx tsc --noEmit                                                    # 0 error
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8090/admin # 200
```

- 샘플 페이지에 블록 추가해서 프리뷰 렌더 확인 (`curl PUT /api/pages/{id}`)
- ZIP export 확인 — 새 블록이 `img_XX.png` 로 나와야 함

## Step 5. 결과 보고 형식

```
✓ 블록 생성 완료: {slug} ({한글이름})

파일:
  lib/blocks/{slug}/{Pascal}.tsx        (신규, N줄)
  lib/blocks/types.ts                   (수정: +A/-B)
  lib/blocks/registry.tsx               (수정: +2줄)
  app/admin/pages/[id]/BlockFields.tsx  (수정: +M줄)

Figma 스펙 이식:
  - 폰트: {list}
  - 색상: {list}
  - 스페이싱: {list}
  - 이미지 슬롯: {size, fit}
  - Figma 변수: {list, if any}

필드:
  - {key} ({kind}) → {의미}

검증:
  - tsc: 0 error
  - admin GET: 200
  - 프리뷰: OK
  - zip export: img_XX.png 포함 OK
```

---

## 흔한 실수 (하지 말 것)

- `get_design_context` 없이 스크린샷만 보고 픽셀 값 추정
- Figma 변수(`var(--color-x)`) 를 무시하고 hex 값으로 하드코딩 (변수명 코멘트라도 남겨라)
- `<div>` 로 렌더 (반드시 `<section data-block-type="...">`)
- 사전 외 새 필드를 임의로 추가 (사전 먼저 확장)
- 검증 스킵
