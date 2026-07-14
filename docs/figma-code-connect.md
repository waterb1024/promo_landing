# Figma Code Connect — Landing CMS 블록 매핑

Figma 컴포넌트를 Landing CMS 코드베이스의 블록에 직접 매핑하면, 디자이너가 Figma 에서 컴포넌트를 인스턴스화할 때부터 어떤 코드 블록이 대응되는지 자동으로 알 수 있음 (Figma Dev Mode 에서 스니펫 자동 표시).

## 이 저장소의 준비 상태

- `figma.config.json` — Code Connect 설정 (include: `lib/blocks/**/*.figma.tsx`)
- `lib/blocks/*/*.figma.tsx` — 4종 블록(hero, image_text, notice, cta) 매핑 파일 뼈대. **URL 자리는 `REPLACE_FILE`, `REPLACE` 로 표시된 TODO.**
- `npm run figma:connect:parse` — 문법 검증
- `npm run figma:connect:publish` — Figma 에 매핑 업로드

## 디자이너 워크플로

1. **Figma 에서 4종 블록을 컴포넌트로 만든다** — 이미 프레임이 있으면 우클릭 → "Create component"
2. **Property 이름을 매핑 파일과 맞춘다:**
   - Hero: `Label`, `Title`, `Subtitle`, `Image` (instance swap), `Label BG` (variant), `Background` (variant)
   - ImageText: `Title`, `Body`, `Image`, `Layout` (variant: Image Top/Bottom/Left/Right)
   - Notice: `Title`, `Background` (variant: Gray/White/Warning)
   - CTA: `Label`, `Variant` (Primary/Secondary)
3. **컴포넌트를 우클릭 → "Copy link to selection"** 으로 URL 복사
4. `lib/blocks/{blockname}/{Block}.figma.tsx` 파일 열어서 URL 자리(`REPLACE_FILE`, `REPLACE`) 를 방금 복사한 URL 로 교체
5. `npm run figma:connect:parse` 로 문법 검증
6. `FIGMA_ACCESS_TOKEN=... npm run figma:connect:publish` 로 Figma 서버에 매핑 업로드

## 새 블록 매핑 추가

새 블록을 추가할 때는:

1. `/new-block` (또는 `npm run block:new`) 로 코드 블록 먼저 만듦
2. `lib/blocks/{new}/{New}.figma.tsx` 을 위 4개 파일 중 유사한 것 복사해서 시작
3. Figma 에서 대응 컴포넌트 만들고 property 이름 맞춤
4. URL 채우고 publish

## Figma Access Token 발급

1. https://www.figma.com/settings → Personal access tokens
2. New token → Scopes: **Code Connect Write** 선택
3. 저장 후 `.env.local` 또는 셸에 export

```bash
export FIGMA_ACCESS_TOKEN=figd_xxxxxx
npm run figma:connect:publish
```

## 검증

- 매핑이 성공하면 Figma Dev Mode 에서 컴포넌트 선택 시 오른쪽 패널에 이 저장소의 블록 코드가 표시됨
- 스니펫 안 나오면 (1) 컴포넌트 property 이름이 매핑 파일과 다름 (2) URL 오타 (3) token 권한 부족 순서로 확인

## 참고

- 공식 docs: https://www.figma.com/code-connect-docs/
- 이 저장소의 `figma:figma-code-connect` 스킬로 클로드에게 매핑 파일 자동 생성 부탁 가능
