# Landing CMS

전시(랜딩) 자동화 CMS. 사업부가 웹에서 블록 조합으로 상세페이지를 작성하면 자동 발행 + PNG/ZIP 익스포트까지 되는 사내 플랫폼.

- **Next.js 16 + React 19 + Tailwind + Playwright**
- 340+ 개 Figma 상세페이지를 정규화 → 10~15개 블록 타입으로 수렴 → 사업부는 필드만 채움 (디자인 일관성 + 자동화)
- 지자체별 브랜드 프리셋 (인천 · 양산 · 울산 · 청주) 을 블록 내 셀렉트로 스왑

---

## 실행

```bash
npm install
npm run dev            # http://localhost:8090
```

- Playwright PNG 익스포트 사용 시 `npx playwright install chromium` 필요
- AI 이미지 생성은 [promo-automation helper](https://github.com/waterb1024/promo_automation) 가 `127.0.0.1:7000` 에 떠 있어야 동작

## 주요 화면

| URL | 설명 |
|---|---|
| `/admin` | 관리자 (좌측 사이드바에서 페이지 선택 · 새 페이지 · 삭제) |
| `/admin/pages/{id}` | 블록 편집 + 실시간 프리뷰 (1080 × 32% 스케일) |
| `/render/{id}` | 발행된 페이지 그대로 렌더 |
| `/render/{id}?export=1` | PNG 익스포트 모드 (여백 · 애니메이션 제거) |
| `/api/pages/{id}/export` | 랜딩 규칙에 맞춰 ZIP (메인 + 블록별 img_01..) 다운로드 |
| `/api/pages/{id}/export?format=png` | 단일 PNG 폴백 |

## npm 스크립트

```bash
npm run dev                    # 개발 서버 (포트 8090)
npm run build                  # 프로덕션 빌드
npm run block:new [slug]       # 새 블록 스캐폴더 (대화형)
npm run gallery:import         # 원격 갤러리에서 자산 임포트 (GALLERY_URL env var 필요)
npm run figma:connect:parse    # Figma Code Connect 매핑 문법 검증
npm run figma:connect:publish  # Figma 서버에 매핑 업로드 (FIGMA_ACCESS_TOKEN 필요)
```

---

## 아키텍처

### 블록 시스템

블록 타입 하나 추가 = 파일 **4곳만** 수정 (엄격 규칙):

```
lib/blocks/{slug}/{Pascal}.tsx      ← 렌더 컴포넌트 (신규)
lib/blocks/types.ts                 ← 유니온 타입 + BLOCK_TYPE_META + defaultBlock case
lib/blocks/registry.tsx             ← RenderBlock switch case
app/admin/pages/[id]/BlockFields.tsx ← 폼 필드 컴포넌트
```

필드 이름은 **캐노니컬 사전 준수** (`lib/blocks/field-schema.ts`) — 자유 명명 금지. 이걸 지키면 지자체·브랜드 스왑 유틸이 일관되게 동작.

### 블록 목록

| 타입 | 설명 |
|---|---|
| `hero` | 라벨(뱃지) + 타이틀 + 서브 + 배경 이미지 |
| `image_text` | 이미지와 텍스트를 상하좌우로 배치 |
| `notice` | 제목 + 불릿 리스트 |
| `cta` | 행동 유도 버튼 |
| `marketing_consent_bottom` | 마케팅 수신동의 (하단) — 4개 지자체 프리셋 · 유의사항 3섹션 on/off |

### 데이터

- 저장은 `data/pages/*.json` (로컬 파일, Turso 이행 전 임시)
- 자산은 `data/assets/*` + `data/assets.json` 인덱스 — 로컬 업로드 · AI 생성 · 원격 갤러리 임포트 모두 여기로 수렴
- `data/` 는 저장소에 커밋되지 않음 (런타임 상태)

### PNG/ZIP 익스포트

`{MMDD}_landing_{promotion}_{width}.zip` 파일명 규칙은 [`promo-automation`](https://github.com/waterb1024/promo_automation) 그대로 이식. Zip 내부:

```
{MMDD}_landing_{promotion}_{width}/
├─ {MMDD}_landing_{promotion}_{width}.png    ← 메인 (한 장 전체)
├─ img_01.png                                 ← 블록 1
├─ img_02.png                                 ← 블록 2
└─ img_03.png                                 ← ...
```

Playwright 로 각 `[data-block-slot]` 을 개별 스크린샷 → JSZip 으로 폴더 구조 유지 후 응답.

---

## 디자이너 워크플로 (4트랙)

디자이너가 새 블록·페이지를 만들 때 클로드 결과 편차를 줄이기 위한 4개 트랙:

### A. 표준 지시문 — `/new-block`

`.claude/commands/new-block.md` 에 필드 이름 규칙 · 픽셀 스펙 반영 순서 · 4개 파일 수정 규칙 · 검증 절차 고정. 클로드가 매번 같은 절차 밟음.

### B. 스캐폴더 CLI — `npm run block:new`

`lib/blocks/field-schema.ts` 의 캐노니컬 필드에서 번호 선택 → 4개 파일 뼈대 자동 생성. 클로드는 픽셀 CSS 만 채움 → 편차 최소.

### C. Figma URL 자동 추출 — `/block-from-figma`

Figma URL 하나로 `get_metadata` → `get_design_context` → `get_screenshot` 3단계 강제 → 폰트·컬러·스페이싱 그대로 이식.

### D. Figma Code Connect

`figma.config.json` + `lib/blocks/*/*.figma.tsx` 매핑 파일. 디자이너가 Figma 컴포넌트를 이 저장소 블록에 매핑하면 Figma Dev Mode 에 코드 스니펫 자동 노출. 상세: [`docs/figma-code-connect.md`](docs/figma-code-connect.md)

---

## 마케팅 수신동의 (하단) 블록

지자체별 브랜드 프리셋을 블록 내 셀렉트로 스왑하는 대표 사례.

### 지자체 프리셋 (`lib/blocks/marketing_consent_bottom/regions.ts`)

| 지자체 | 서비스 | brand | badge circle |
|---|---|---|---|
| 인천 | 인천e음 | `#F4A106` | `#F4A106` |
| 양산 | 양산사랑카드 | `#6040D0` | `#F0C000` |
| 울산 | 울산페이 | `#804090` | `#804090` |
| 청주 | 청주페이 | `#30A030` | `#30A030` |

각 지자체는 asset library 에 태그 `role:mkt-consent-card` + `service:{지자체}` 로 업로드된 925×570 가이드 카드 이미지 (오렌지 헤더 · 3-step phones · 라벨 · 스위치 데코 baked in) 를 참조.

### 유의사항 3섹션 on/off

- **유의사항** (57px Bold)
- **웰컴쿠폰 유의사항** (52px SemiBold)
- **첫 주문 감사쿠폰 유의사항** (52px SemiBold)

각 섹션마다 노출 체크박스 + 제목 + 항목(한 줄에 하나). 기본은 셋 다 노출.

### 새 지자체 추가

1. 가이드 카드 이미지를 asset library 에 업로드 (`role:mkt-consent-card` + `service:{지자체}` 태그)
2. `lib/blocks/marketing_consent_bottom/regions.ts` 에 항목 추가 (`key`, `label`, `brandColor`, `badgeCircleColor`, `guideImageAssetId`, `serviceLabel`)
3. 끝 — UI 코드 수정 불필요, 셀렉트 옵션 자동 노출

---

## 관련 저장소

- [waterb1024/promo_automation](https://github.com/waterb1024/promo_automation) — Figma 플러그인 · Python helper (AI 이미지 생성 · zip 규칙 원본)

## 세션 로그

- [`docs/SESSION_2026-07-14.md`](docs/SESSION_2026-07-14.md) — 초기 골격 → 이미지 라이브러리 → PNG 익스포트 → 디자이너 워크플로 → 마케팅 수신동의 지자체 블록까지 몰아붙인 세션 요약
