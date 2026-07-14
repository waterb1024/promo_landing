import type { NoticeBlock } from "../types";

export function Notice({ block }: { block: NoticeBlock }) {
  return (
    <section
      data-block-type="notice"
      style={{ backgroundColor: block.bg ?? "#f4f4f4" }}
      className="w-full px-[80px] py-[100px]"
    >
      <div className="rounded-[40px] bg-white p-[60px]">
        {block.title ? (
          <h3
            className="mb-[30px] font-bold"
            style={{
              color: "#121212",
              fontSize: 56,
              lineHeight: 1.25,
              letterSpacing: "-0.56px"
            }}
          >
            {block.title}
          </h3>
        ) : null}
        <ul className="space-y-[20px]">
          {block.bullets.map((b, i) => (
            <li
              key={i}
              className="flex gap-[16px]"
              style={{
                color: "#121212",
                fontSize: 36,
                lineHeight: 1.5,
                letterSpacing: "-0.36px"
              }}
            >
              <span className="mt-[10px] inline-block h-[10px] w-[10px] shrink-0 rounded-full bg-black/70" />
              <span style={{ whiteSpace: "pre-line" }}>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
