import type { HeroBlock } from "../types";

export function Hero({ block }: { block: HeroBlock }) {
  const bg = block.bg ?? "#dbf5ff";
  const labelBg = block.labelBg ?? "#2badd7";
  const labelColor = block.labelColor ?? "#ffffff";
  const labelVisible = block.labelVisible !== false;
  const subtitleVisible = block.subtitleVisible !== false;

  return (
    <section
      data-block-type="hero"
      style={{ backgroundColor: bg }}
      className="w-full"
    >
      <div className="flex w-full flex-col items-center pt-[180px]">
        <div className="flex w-full flex-col items-center gap-[30px]">
          {labelVisible && block.label ? (
            <div
              className="inline-flex items-center justify-center rounded-[555px] px-[40px] py-[20px]"
              style={{ backgroundColor: labelBg }}
            >
              <span
                className="whitespace-nowrap text-center font-bold"
                style={{
                  color: labelColor,
                  fontSize: 50,
                  lineHeight: 1.25,
                  letterSpacing: "-0.5px"
                }}
              >
                {block.label}
              </span>
            </div>
          ) : null}

          <h2
            className="w-full text-center font-bold"
            style={{
              color: "#121212",
              fontSize: 111,
              lineHeight: 1.25,
              letterSpacing: "-1.11px",
              whiteSpace: "pre-line"
            }}
          >
            {block.title}
          </h2>

          {subtitleVisible && block.subtitle ? (
            <p
              className="w-full text-center"
              style={{
                color: "#121212",
                fontSize: 45,
                lineHeight: 1.55,
                letterSpacing: "-0.45px",
                opacity: 0.8,
                whiteSpace: "pre-line"
              }}
            >
              {block.subtitle}
            </p>
          ) : null}
        </div>

        <div className="relative mt-[50px] h-[1000px] w-full">
          {block.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={block.imageUrl}
              alt={block.imageAlt ?? ""}
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[36px] text-black/30">
              (이미지 슬롯 1080 × 1000)
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
