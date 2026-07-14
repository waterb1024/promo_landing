---
description: Landing CMS 에 새 블록 타입을 표준 절차로 추가한다
---

# /new-block — Landing CMS 새 블록 추가 표준 절차

**목적:** 매번 같은 이름 규칙·구조로 새 블록을 만들어 디자이너·클로드 사이 편차를 없앤다.

**사용자가 줄 정보 (없으면 물어봐라):**
1. 블록 슬러그 (snake_case, 예: `guide_step`, `merchant_grid`, `qr_download`)
2. 한글 이름 + 한 줄 설명 (BLOCK_TYPE_META 에 들어감)
3. 픽셀 스펙 — Figma URL / 스크린샷 / 스펙 텍스트 중 하나 (있어야 함)
4. 필드 목록 (없으면 스펙 보고 제안 → 확정)

---

## Step 0. 파일 목록 확인 (수정할 곳 4곳 뿐이다. 이 이상은 만들지 마라)

```
lib/blocks/{slug}/{Pascal}.tsx     ← 렌더 컴포넌트 (신규)
lib/blocks/types.ts                ← 유니온 타입 + BLOCK_TYPE_META + defaultBlock case
lib/blocks/registry.tsx            ← RenderBlock switch case
app/admin/pages/[id]/BlockFields.tsx ← 폼 필드 컴포넌트 (기존에 있는 패턴 그대로)
```

`data/*.json` / API 라우트 / 렌더 페이지는 **절대 건드리지 마라**. 블록 시스템의 핵심 원칙은 "이 4곳만 수정하면 새 블록이 완성된다" — 이걸 어기면 안 됨.

## Step 1. 필드 이름 사전 준수

`lib/blocks/field-schema.ts` 에 정의된 **캐노니컬 필드명만** 사용한다. 사전에 없는 필드가 필요하면 사용자에게 확인받고 사전에 먼저 추가.

**흔한 필드 (사전에서 발췌):**

| 목적 | 필드명 | 타입 |
|---|---|---|
| 배경색 | `bg` | color |
| 라벨(뱃지) 텍스트 | `label` | text |
| 라벨 배경색 | `labelBg` | color |
| 라벨 글자색 | `labelColor` | color |
| 타이틀 | `title` | textarea |
| 서브타이틀 | `subtitle` | textarea |
| 본문 | `body` | textarea |
| 이미지 URL | `imageUrl` | asset |
| 이미지 alt | `imageAlt` | text |
| CTA 라벨 | `label` (블록 컨텍스트) | text |
| CTA 링크 | `href` | url |
| 스타일 variant | `variant` | select |
| 불릿 배열 | `bullets` | textarea (한 줄 하나) |

**금지 예시** (자유 명명 금지): `titleText`, `title_color`, `label_background`, `imgSrc`, `heading` — 전부 잘못. 사전에 있는 이름만 써라.

## Step 2. 픽셀 스펙 추출 (Figma 있을 때)

- Figma URL 이 있으면 반드시 `mcp__plugin_figma_figma__get_design_context` 로 폰트 크기·컬러·스페이싱을 인용부호 없이 그대로 이식. **추정하지 마라.**
- 스크린샷만 있으면 사용자에게 "폰트 크기 몇 px, letter-spacing 얼마" 재확인.
- 이미 있는 블록(`hero`, `image_text`, `notice`, `cta`)의 스펙 표기 스타일을 그대로 따라라 (`fontSize`, `lineHeight`, `letterSpacing`, `whiteSpace: "pre-line"` 등 인라인 style).

## Step 3. 파일 4개 수정 순서

**3-1.** `lib/blocks/types.ts` — 유니온에 새 타입 추가 + `BLOCK_TYPE_META` 에 한글 이름/설명 + `defaultBlock` switch case
**3-2.** `lib/blocks/{slug}/{Pascal}.tsx` — 렌더 컴포넌트 (반드시 `<section data-block-type="{slug}" className="w-full">` 로 감쌈. 이 규칙 어기면 zip export 가 깨진다)
**3-3.** `lib/blocks/registry.tsx` — RenderBlock switch case 추가
**3-4.** `app/admin/pages/[id]/BlockFields.tsx` — 기존 `HeroFields`/`ImageTextFields` 패턴 그대로 복사해서 새 `{Pascal}Fields` 컴포넌트 만들고 상단 switch 에 case 추가. 이미지 필드는 반드시 `<ImageField>` 컴포넌트 재사용 (수동 URL 인풋 만들지 마라).

## Step 4. 검증 순서

1. `npx tsc --noEmit` — 에러 0
2. `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8090/admin` — 200
3. 샘플 페이지에 새 블록을 실제 추가해서 프리뷰 렌더 확인 (curl 로 `/api/pages/{id}` PUT)
4. zip 익스포트 확인 — `curl -s http://localhost:8090/api/pages/{id}/export -o /tmp/x.zip && python3 -c "import zipfile; [print(n) for n in zipfile.ZipFile('/tmp/x.zip').namelist()]"` — 새 블록이 `img_XX.png` 로 나와야 함

## Step 5. 완료 후 사용자에게 보고

- 만든 파일 4개 목록 (경로 + 라인 수)
- 사전에 새로 추가한 필드가 있으면 그 목록
- 검증 결과 4가지 (타입체크 / admin 200 / 프리뷰 / zip 안 img_XX 포함)
- **하나라도 실패했으면 완료 보고하지 마라. 문제를 명확히 해결부터.**

---

## 나쁜 예시 (하지 말 것)

- 필드 이름 변형 (`title_color` 같은 사전 외 명명)
- `<section>` 이 아닌 `<div>` 로 렌더 (export 마커 깨짐)
- 픽셀 값 추정 ("적당히 40px 정도")
- 4개 파일 외 다른 곳 수정 (API, storage, 렌더 페이지 등)
- 검증 안 하고 완료 보고
