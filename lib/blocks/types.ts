import {
  findRegion,
  regionPresetPatch
} from "./marketing_consent_bottom/regions";

export type BlockBase = {
  id: string;
};

export type HeroBlock = BlockBase & {
  type: "hero";
  label?: string;
  labelColor?: string;
  labelBg?: string;
  labelVisible?: boolean;
  title: string;
  subtitle?: string;
  subtitleVisible?: boolean;
  bg?: string;
  imageUrl?: string;
  imageAlt?: string;
};

export type ImageTextBlock = BlockBase & {
  type: "image_text";
  layout: "image_top" | "image_bottom" | "image_left" | "image_right";
  title?: string;
  body?: string;
  imageUrl?: string;
  imageAlt?: string;
  bg?: string;
};

export type NoticeBlock = BlockBase & {
  type: "notice";
  title?: string;
  bullets: string[];
  bg?: string;
};

export type CtaBlock = BlockBase & {
  type: "cta";
  label?: string;
  href?: string;
  variant?: "primary" | "secondary";
};

export type MarketingConsentBottomBlock = BlockBase & {
  type: "marketing_consent_bottom";
  region?: "인천" | "양산" | "울산" | "청주";
  bg?: string;
  brandColor?: string;
  badgeCircleColor?: string;
  title: string;
  subtitle: string;
  guideHeaderText?: string;
  guideImageUrl?: string;
  guideCardBg?: string;
  noticeVisible?: boolean;
  noticeTitle?: string;
  noticeItems: string[];
  welcomeVisible?: boolean;
  welcomeTitle?: string;
  welcomeItems: string[];
  firstOrderVisible?: boolean;
  firstOrderTitle?: string;
  firstOrderItems: string[];
};

export type BlockType =
  | HeroBlock
  | ImageTextBlock
  | NoticeBlock
  | CtaBlock
  | MarketingConsentBottomBlock;

export type DetailPage = {
  id: string;
  title: string;
  service: string;
  templateVariant?: string;
  status: "draft" | "published";
  blocks: BlockType[];
  updatedAt: string;
  updatedBy?: string;
};

export const BLOCK_TYPE_META: Record<
  BlockType["type"],
  { name: string; description: string }
> = {
  hero: { name: "히어로", description: "라벨 + 타이틀 + 서브 + 배경 이미지" },
  image_text: { name: "이미지+텍스트", description: "이미지와 텍스트를 상하좌우로 배치" },
  notice: { name: "안내박스", description: "제목 + 불릿 리스트" },
  cta: { name: "CTA 버튼", description: "행동 유도 버튼" },
  marketing_consent_bottom: {
    name: "마케팅 수신동의 (하단)",
    description: "브랜드 컬러 · 가이드 카드 · 유의사항 3섹션(on/off) — 지자체 대응"
  }
};

export function defaultBlock(type: BlockType["type"]): BlockType {
  const base = { id: cryptoRandomId() };
  switch (type) {
    case "hero":
      return {
        ...base,
        type: "hero",
        label: "라벨",
        title: "타이틀을 입력하세요",
        subtitle: "서브 타이틀",
        bg: "#FFE24D"
      };
    case "image_text":
      return {
        ...base,
        type: "image_text",
        layout: "image_top",
        title: "제목",
        body: "본문을 입력하세요"
      };
    case "notice":
      return {
        ...base,
        type: "notice",
        title: "안내사항",
        bullets: ["항목 1", "항목 2"]
      };
    case "cta":
      return { ...base, type: "cta", label: "자세히 보기", variant: "primary" };
    case "marketing_consent_bottom": {
      const preset = findRegion("인천");
      const presetPatch = preset ? regionPresetPatch(preset) : {};
      return {
        ...base,
        type: "marketing_consent_bottom",
        ...presetPatch,
        bg: "#eeeeee",
        title: "마케팅 수신동의는 하셨나요?",
        subtitle:
          "본 이벤트는 마케팅 수신동의를\n한 회원을 대상으로 진행됩니다. 이벤트 참여 시점에\n마케팅수신동의가 되어있지 않을 시 쿠폰 발급 및\n이벤트 참여가 불가합니다.",
        noticeVisible: true,
        noticeTitle: "유의사항",
        noticeItems: [
          "본 이벤트는 마케팅 수신 동의를 하신 분에 한해서 참여 가능합니다.",
          "이벤트 내용과 기간은 부득이한 경우 별도의 사전 공지 없이 변경될 수 있습니다.",
          "마케팅 수신동의 취하 시 이벤트 혜택에서 제외됩니다."
        ],
        welcomeVisible: true,
        welcomeTitle: "웰컴쿠폰 유의사항",
        welcomeItems: [
          "본 쿠폰은 앱을 한 번도 사용하지 않은 회원을 대상으로 발급되는 쿠폰입니다."
        ],
        firstOrderVisible: true,
        firstOrderTitle: "첫 주문 감사쿠폰 유의사항",
        firstOrderItems: ["본 쿠폰은 웰컴 쿠폰을 사용한 회원에 한 해 발급됩니다."]
      };
    }
  }
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}
