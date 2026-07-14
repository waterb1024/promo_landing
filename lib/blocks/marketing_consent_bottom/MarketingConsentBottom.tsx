import type { MarketingConsentBottomBlock } from "../types";

// Figma spec: WMYs9JCPzqL6rBFKM94Cx4 / node 146:3082 (마케팅 수신동의 4-지자체 variant)
// 컨테이너 px 80 py 120, 섹션 간 gap 120px
// 가이드 카드(925×570) 는 오렌지 헤더 + 3-step phones + labels + switch 데코 통합 이미지로 지자체별 스왑
// 뱃지 · 불릿 dot 등 시각 요소는 CSS로 brandColor 를 따라감

export function MarketingConsentBottom({
  block
}: {
  block: MarketingConsentBottomBlock;
}) {
  const bg = block.bg ?? "#eeeeee";
  const brand = block.brandColor ?? "#f4a106";
  const badgeCircle = block.badgeCircleColor ?? brand;

  const noticeVisible = block.noticeVisible !== false;
  const welcomeVisible = block.welcomeVisible !== false;
  const firstOrderVisible = block.firstOrderVisible !== false;

  return (
    <section
      data-block-type="marketing_consent_bottom"
      className="w-full"
      style={{ backgroundColor: bg }}
    >
      <div className="flex flex-col items-center justify-center gap-[120px] px-[80px] py-[120px]">
        {/* Header + 가이드 카드 */}
        <div className="flex flex-col items-center gap-[52px]">
          <div className="flex w-full flex-col items-center gap-[32px]">
            {/* 뱃지 — Figma 220×97: 흰 pill + 좌측 "동의" 텍스트 + 우측 brand 색 원 */}
            <div
              className="inline-flex items-center rounded-full bg-white"
              style={{
                paddingLeft: 32,
                paddingRight: 22,
                paddingTop: 18,
                paddingBottom: 18,
                gap: 16
              }}
            >
              <span
                className="font-black"
                style={{
                  color: "#132145",
                  fontSize: 40,
                  lineHeight: 1.5,
                  letterSpacing: "-0.8px",
                  fontFamily: "SUIT, Pretendard, sans-serif"
                }}
              >
                동의
              </span>
              <span
                aria-hidden
                className="inline-block rounded-full"
                style={{
                  width: 61,
                  height: 61,
                  backgroundColor: badgeCircle
                }}
              />
            </div>

            <div className="flex w-full flex-col items-center gap-[24px] text-center">
              <h2
                className="w-full font-extrabold"
                style={{
                  color: "#000000",
                  fontSize: 52,
                  lineHeight: "89px",
                  letterSpacing: "-1.04px",
                  whiteSpace: "pre-line"
                }}
              >
                {block.title}
              </h2>
              <div
                className="w-full"
                style={{
                  color: "#333333",
                  fontSize: 42,
                  lineHeight: "65px",
                  letterSpacing: "-0.84px",
                  whiteSpace: "pre-line"
                }}
              >
                {block.subtitle}
              </div>
            </div>
          </div>

          {/* 가이드 카드 — Figma 지자체별 이미지 통째 (925×570) */}
          <div
            style={{
              width: 925,
              aspectRatio: "925 / 570",
              borderRadius: 32,
              overflow: "hidden",
              backgroundColor: "#eeeeee"
            }}
          >
            {block.guideImageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={block.guideImageUrl}
                alt="마케팅 수신 방법 안내"
                className="block h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-center"
                style={{ color: "#999", fontSize: 32, padding: 40 }}
              >
                (지자체별 가이드 카드 — Figma 참조 이미지 업로드 필요)
              </div>
            )}
          </div>
        </div>

        {noticeVisible && (
          <NoticeGroup
            title={block.noticeTitle ?? "유의사항"}
            items={block.noticeItems}
            titleSize={57}
            titleWeight="bold"
            titleTracking="-0.57px"
            brand={brand}
          />
        )}

        {welcomeVisible && (
          <NoticeGroup
            title={block.welcomeTitle ?? "웰컴쿠폰 유의사항"}
            items={block.welcomeItems}
            titleSize={52}
            titleWeight="semibold"
            titleTracking="-0.52px"
            brand={brand}
          />
        )}

        {firstOrderVisible && (
          <NoticeGroup
            title={block.firstOrderTitle ?? "첫 주문 감사쿠폰 유의사항"}
            items={block.firstOrderItems}
            titleSize={52}
            titleWeight="semibold"
            titleTracking="-0.52px"
            brand={brand}
          />
        )}
      </div>
    </section>
  );
}

function NoticeGroup({
  title,
  items,
  titleSize,
  titleWeight,
  titleTracking,
  brand
}: {
  title: string;
  items: string[];
  titleSize: number;
  titleWeight: "bold" | "semibold";
  titleTracking: string;
  brand: string;
}) {
  return (
    <div className="flex w-full flex-col items-start justify-center gap-[24px]">
      <p
        className={`w-full ${
          titleWeight === "bold" ? "font-bold" : "font-semibold"
        }`}
        style={{
          color: "#000000",
          fontSize: titleSize,
          lineHeight: 1.55,
          letterSpacing: titleTracking
        }}
      >
        {title}
      </p>
      {items.length > 0 && (
        <ul className="flex w-full flex-col gap-[12px]">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-[24px]">
              {/* Figma 스펙: 12×71 컨테이너에 상단 다크 dot (#333). brandColor 아님. */}
              <span
                aria-hidden
                className="inline-block shrink-0"
                style={{
                  width: 12,
                  height: 71,
                  position: "relative"
                }}
              >
                <span
                  className="absolute"
                  style={{
                    left: 0,
                    top: 26,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: "#333333"
                  }}
                />
              </span>
              <p
                className="flex-1"
                style={{
                  color: "#333333",
                  fontSize: 46,
                  lineHeight: 1.55,
                  letterSpacing: "-0.46px",
                  whiteSpace: "pre-wrap"
                }}
              >
                {it}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
