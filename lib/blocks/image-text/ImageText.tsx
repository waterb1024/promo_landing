import type { ImageTextBlock } from "../types";

export function ImageText({ block }: { block: ImageTextBlock }) {
  const isVertical = block.layout === "image_top" || block.layout === "image_bottom";
  const flexDir =
    block.layout === "image_top"
      ? "flex-col"
      : block.layout === "image_bottom"
        ? "flex-col-reverse"
        : block.layout === "image_left"
          ? "flex-row"
          : "flex-row-reverse";

  return (
    <section
      data-block-type="image_text"
      style={{ backgroundColor: block.bg ?? "#ffffff" }}
      className="w-full px-[80px] py-[100px]"
    >
      <div className={`flex w-full items-center gap-[50px] ${flexDir}`}>
        <div className={isVertical ? "w-full" : "flex-1"}>
          {block.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={block.imageUrl}
              alt={block.imageAlt ?? ""}
              className="h-auto w-full object-contain"
            />
          ) : (
            <div className="flex h-[600px] w-full items-center justify-center bg-black/5 text-[36px] text-black/30">
              (이미지)
            </div>
          )}
        </div>
        <div className={isVertical ? "w-full text-center" : "flex-1"}>
          {block.title ? (
            <h3
              className="mb-[24px] font-bold"
              style={{
                color: "#121212",
                fontSize: 72,
                lineHeight: 1.25,
                letterSpacing: "-0.72px"
              }}
            >
              {block.title}
            </h3>
          ) : null}
          {block.body ? (
            <p
              style={{
                color: "#121212",
                fontSize: 40,
                lineHeight: 1.6,
                letterSpacing: "-0.4px",
                whiteSpace: "pre-line",
                opacity: 0.85
              }}
            >
              {block.body}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
