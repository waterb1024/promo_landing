// Canonical field vocabulary for Landing CMS blocks.
// New blocks must reuse these field names. Adding new names requires
// updating this file AND the corresponding form renderer in BlockFields.tsx.
// See .claude/commands/new-block.md for the full procedure.

export type FieldKind =
  | "text"
  | "textarea"
  | "color"
  | "url"
  | "asset"
  | "select"
  | "bullets"
  | "number"
  | "boolean";

export type FieldDef = {
  key: string;
  kind: FieldKind;
  label: string; // Korean label shown in the editor
  optional?: boolean;
  default?: string | number | boolean | string[];
  options?: Array<{ value: string; label: string }>; // for select
  hint?: string;
};

// The canonical registry. Field names on the left are the ONLY names allowed
// on block payloads. Do not rename without a migration.
export const CANONICAL_FIELDS: Record<string, FieldDef> = {
  // ---- container ----
  bg: {
    key: "bg",
    kind: "color",
    label: "배경색",
    optional: true,
    default: "#ffffff"
  },
  brandColor: {
    key: "brandColor",
    kind: "color",
    label: "브랜드 컬러 (지자체별 primary)",
    optional: true,
    default: "#f4a106",
    hint: "인천 · 양산 · 울산 · 청주 등 지자체 대표 색상. 뱃지 · 헤더 · 스위치 등에 반영"
  },

  // ---- label (badge) ----
  label: {
    key: "label",
    kind: "text",
    label: "라벨 (뱃지)",
    optional: true
  },
  labelBg: {
    key: "labelBg",
    kind: "color",
    label: "라벨 배경",
    optional: true,
    default: "#2badd7"
  },
  labelColor: {
    key: "labelColor",
    kind: "color",
    label: "라벨 글자색",
    optional: true,
    default: "#ffffff"
  },

  // ---- headings & copy ----
  title: {
    key: "title",
    kind: "textarea",
    label: "타이틀 (줄바꿈 Enter)"
  },
  subtitle: {
    key: "subtitle",
    kind: "textarea",
    label: "서브 타이틀",
    optional: true
  },
  body: {
    key: "body",
    kind: "textarea",
    label: "본문",
    optional: true
  },
  eyebrow: {
    key: "eyebrow",
    kind: "text",
    label: "상단 소제목",
    optional: true
  },
  caption: {
    key: "caption",
    kind: "text",
    label: "이미지 캡션",
    optional: true
  },

  // ---- imagery ----
  imageUrl: {
    key: "imageUrl",
    kind: "asset",
    label: "이미지",
    optional: true,
    hint: "라이브러리에서 선택 · 업로드 · AI 생성"
  },
  imageAlt: {
    key: "imageAlt",
    kind: "text",
    label: "이미지 대체 텍스트",
    optional: true
  },

  // ---- link / CTA ----
  href: {
    key: "href",
    kind: "url",
    label: "링크 URL",
    optional: true
  },
  variant: {
    key: "variant",
    kind: "select",
    label: "스타일",
    default: "primary",
    options: [
      { value: "primary", label: "Primary" },
      { value: "secondary", label: "Secondary" }
    ]
  },

  // ---- lists ----
  bullets: {
    key: "bullets",
    kind: "bullets",
    label: "불릿 항목 (한 줄에 하나)",
    default: []
  },

  // ---- layout modifiers ----
  layout: {
    key: "layout",
    kind: "select",
    label: "레이아웃",
    default: "image_top",
    options: [
      { value: "image_top", label: "이미지 위" },
      { value: "image_bottom", label: "이미지 아래" },
      { value: "image_left", label: "이미지 왼쪽" },
      { value: "image_right", label: "이미지 오른쪽" }
    ]
  },
  align: {
    key: "align",
    kind: "select",
    label: "정렬",
    default: "center",
    options: [
      { value: "left", label: "왼쪽" },
      { value: "center", label: "가운데" },
      { value: "right", label: "오른쪽" }
    ]
  }
};

export function fieldDef(key: string): FieldDef | undefined {
  return CANONICAL_FIELDS[key];
}

export function isCanonicalField(key: string): boolean {
  return key in CANONICAL_FIELDS;
}
