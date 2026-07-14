import type { CtaBlock } from "../types";

export function Cta({ block }: { block: CtaBlock }) {
  const bg = block.variant === "secondary" ? "#e6e6e6" : "#2badd7";
  const fg = block.variant === "secondary" ? "#121212" : "#ffffff";

  const content = (
    <span
      className="font-bold"
      style={{ color: fg, fontSize: 48, letterSpacing: "-0.48px" }}
    >
      {block.label ?? "자세히 보기"}
    </span>
  );

  return (
    <section data-block-type="cta" className="w-full px-[80px] py-[80px]">
      {block.href ? (
        <a
          href={block.href}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center rounded-[100px] py-[40px]"
          style={{ backgroundColor: bg }}
        >
          {content}
        </a>
      ) : (
        <div
          className="flex w-full items-center justify-center rounded-[100px] py-[40px]"
          style={{ backgroundColor: bg }}
        >
          {content}
        </div>
      )}
    </section>
  );
}
