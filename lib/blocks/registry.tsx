import type { BlockType } from "./types";
import { Hero } from "./hero/Hero";
import { ImageText } from "./image-text/ImageText";
import { Notice } from "./notice/Notice";
import { Cta } from "./cta/Cta";
import { MarketingConsentBottom } from "./marketing_consent_bottom/MarketingConsentBottom";

export function RenderBlock({ block }: { block: BlockType }) {
  switch (block.type) {
    case "hero":
      return <Hero block={block} />;
    case "image_text":
      return <ImageText block={block} />;
    case "notice":
      return <Notice block={block} />;
    case "cta":
      return <Cta block={block} />;
    case "marketing_consent_bottom":
      return <MarketingConsentBottom block={block} />;
  }
}
