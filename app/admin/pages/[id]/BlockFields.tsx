"use client";

import { useState } from "react";
import type { Asset } from "@/lib/assets";
import type {
  BlockType,
  CtaBlock,
  HeroBlock,
  ImageTextBlock,
  MarketingConsentBottomBlock,
  NoticeBlock
} from "@/lib/blocks/types";
import {
  MKT_CONSENT_REGIONS,
  findRegion,
  regionPresetPatch
} from "@/lib/blocks/marketing_consent_bottom/regions";
import { AssetPicker } from "../../AssetPicker";

export function BlockFields({
  block,
  onChange
}: {
  block: BlockType;
  onChange: (next: BlockType) => void;
}) {
  switch (block.type) {
    case "hero":
      return <HeroFields block={block} onChange={onChange} />;
    case "image_text":
      return <ImageTextFields block={block} onChange={onChange} />;
    case "notice":
      return <NoticeFields block={block} onChange={onChange} />;
    case "cta":
      return <CtaFields block={block} onChange={onChange} />;
    case "marketing_consent_bottom":
      return (
        <MarketingConsentBottomFields block={block} onChange={onChange} />
      );
  }
}

function Row({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-semibold text-gray-600">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded border px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none";

function ImageField({
  label,
  value,
  onChange,
  onPalette
}: {
  label: string;
  value: string | undefined;
  onChange: (url: string | undefined) => void;
  /** PNG 자산 선택 시 백엔드에서 뽑아낸 파스텔·엑센트 컬러를 리턴 (선택). */
  onPalette?: (palette: { pastel: string; accent: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Row label={label}>
      <div className="flex gap-2">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded border bg-gray-50">
          {value ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={value}
              alt=""
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = "0.2";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
              없음
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <input
            className={inputCls}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder="URL 직접 입력 or 라이브러리에서 선택"
          />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex-1 rounded border bg-white px-2 py-1 text-xs hover:border-blue-500"
            >
              라이브러리 · 업로드 · AI 생성
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="rounded border px-2 py-1 text-xs text-red-500 hover:bg-red-50"
              >
                제거
              </button>
            )}
          </div>
        </div>
      </div>
      <AssetPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={async (asset: Asset) => {
          // PNG 는 흰 배경 자동 투명화 (?transparent=1)
          const isPng = asset.mime === "image/png";
          const suffix = isPng ? "?transparent=1" : "";
          onChange(`/api/assets/${asset.id}/file${suffix}`);
          setOpen(false);
          // PNG + onPalette 콜백 있을 때만 dominant color 추출 요청 (백엔드 처리)
          if (isPng && onPalette) {
            try {
              const res = await fetch(`/api/assets/${asset.id}/palette`);
              if (res.ok) {
                const j = (await res.json()) as {
                  palette?: { pastel: string; accent: string };
                };
                if (j.palette) onPalette(j.palette);
              }
            } catch {
              // 실패해도 이미지는 이미 적용됨 — 무시
            }
          }
        }}
      />
    </Row>
  );
}

function HeroFields({
  block,
  onChange
}: {
  block: HeroBlock;
  onChange: (next: HeroBlock) => void;
}) {
  const patch = (p: Partial<HeroBlock>) => onChange({ ...block, ...p });
  return (
    <div>
      <Row label="라벨 (뱃지)">
        <input
          className={inputCls}
          value={block.label ?? ""}
          onChange={(e) => patch({ label: e.target.value })}
          placeholder="예: 인천사랑상품권"
        />
      </Row>
      <div className="grid grid-cols-2 gap-2">
        <Row label="라벨 배경">
          <input
            type="color"
            className="h-9 w-full rounded border"
            value={block.labelBg ?? "#2badd7"}
            onChange={(e) => patch({ labelBg: e.target.value })}
          />
        </Row>
        <Row label="라벨 글자색">
          <input
            type="color"
            className="h-9 w-full rounded border"
            value={block.labelColor ?? "#ffffff"}
            onChange={(e) => patch({ labelColor: e.target.value })}
          />
        </Row>
      </div>
      <Row label="타이틀 (줄바꿈은 Enter)">
        <textarea
          className={inputCls}
          rows={3}
          value={block.title}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </Row>
      <Row label="서브 타이틀">
        <textarea
          className={inputCls}
          rows={2}
          value={block.subtitle ?? ""}
          onChange={(e) => patch({ subtitle: e.target.value })}
        />
      </Row>
      <Row label="배경색">
        <input
          type="color"
          className="h-9 w-full rounded border"
          value={block.bg ?? "#dbf5ff"}
          onChange={(e) => patch({ bg: e.target.value })}
        />
      </Row>
      <ImageField
        label="이미지 (1080 × 1000, 선택)"
        value={block.imageUrl}
        onChange={(url) => patch({ imageUrl: url })}
        onPalette={(p) => patch({ bg: p.pastel, labelBg: p.accent })}
      />
    </div>
  );
}

function ImageTextFields({
  block,
  onChange
}: {
  block: ImageTextBlock;
  onChange: (next: ImageTextBlock) => void;
}) {
  const patch = (p: Partial<ImageTextBlock>) => onChange({ ...block, ...p });
  return (
    <div>
      <Row label="레이아웃">
        <select
          className={inputCls}
          value={block.layout}
          onChange={(e) => patch({ layout: e.target.value as ImageTextBlock["layout"] })}
        >
          <option value="image_top">이미지 위</option>
          <option value="image_bottom">이미지 아래</option>
          <option value="image_left">이미지 왼쪽</option>
          <option value="image_right">이미지 오른쪽</option>
        </select>
      </Row>
      <Row label="제목">
        <input
          className={inputCls}
          value={block.title ?? ""}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </Row>
      <Row label="본문">
        <textarea
          className={inputCls}
          rows={4}
          value={block.body ?? ""}
          onChange={(e) => patch({ body: e.target.value })}
        />
      </Row>
      <ImageField
        label="이미지"
        value={block.imageUrl}
        onChange={(url) => patch({ imageUrl: url })}
      />
      <Row label="배경색">
        <input
          type="color"
          className="h-9 w-full rounded border"
          value={block.bg ?? "#ffffff"}
          onChange={(e) => patch({ bg: e.target.value })}
        />
      </Row>
    </div>
  );
}

function NoticeFields({
  block,
  onChange
}: {
  block: NoticeBlock;
  onChange: (next: NoticeBlock) => void;
}) {
  const patch = (p: Partial<NoticeBlock>) => onChange({ ...block, ...p });
  return (
    <div>
      <Row label="제목">
        <input
          className={inputCls}
          value={block.title ?? ""}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </Row>
      <Row label="배경색">
        <input
          type="color"
          className="h-9 w-full rounded border"
          value={block.bg ?? "#f4f4f4"}
          onChange={(e) => patch({ bg: e.target.value })}
        />
      </Row>
      <Row label="불릿 항목 (한 줄에 하나)">
        <textarea
          className={inputCls}
          rows={6}
          value={block.bullets.join("\n")}
          onChange={(e) =>
            patch({
              bullets: e.target.value.split("\n").filter((v, i, a) => v.length > 0 || i < a.length - 1)
            })
          }
        />
      </Row>
    </div>
  );
}

function CtaFields({
  block,
  onChange
}: {
  block: CtaBlock;
  onChange: (next: CtaBlock) => void;
}) {
  const patch = (p: Partial<CtaBlock>) => onChange({ ...block, ...p });
  return (
    <div>
      <Row label="버튼 라벨">
        <input
          className={inputCls}
          value={block.label ?? ""}
          onChange={(e) => patch({ label: e.target.value })}
        />
      </Row>
      <Row label="링크 URL">
        <input
          className={inputCls}
          value={block.href ?? ""}
          onChange={(e) => patch({ href: e.target.value })}
        />
      </Row>
      <Row label="스타일">
        <select
          className={inputCls}
          value={block.variant ?? "primary"}
          onChange={(e) => patch({ variant: e.target.value as CtaBlock["variant"] })}
        >
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
        </select>
      </Row>
    </div>
  );
}

function MarketingConsentBottomFields({
  block,
  onChange
}: {
  block: MarketingConsentBottomBlock;
  onChange: (next: MarketingConsentBottomBlock) => void;
}) {
  const patch = (p: Partial<MarketingConsentBottomBlock>) =>
    onChange({ ...block, ...p });

  const bulletsFromText = (text: string) =>
    text.split("\n").filter((v, i, a) => v.length > 0 || i < a.length - 1);

  const applyRegion = (key: string) => {
    if (!key) {
      patch({
        region: undefined,
        brandColor: undefined,
        badgeCircleColor: undefined,
        guideImageUrl: undefined
      });
      return;
    }
    const preset = findRegion(key);
    if (!preset) return;
    patch(regionPresetPatch(preset));
  };

  return (
    <div>
      <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-3">
        <div className="mb-1 text-xs font-semibold text-blue-900">지자체 프리셋</div>
        <p className="mb-2 text-[11px] leading-relaxed text-blue-800">
          선택하면 브랜드 컬러 · 뱃지 원 색상 · 가이드 카드 이미지가 자동으로 적용됩니다. 이후 개별
          필드는 자유롭게 수정 가능합니다.
        </p>
        <select
          className={inputCls}
          value={block.region ?? ""}
          onChange={(e) => applyRegion(e.target.value)}
        >
          <option value="">— 미선택 (수동 설정) —</option>
          {MKT_CONSENT_REGIONS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <Row label="타이틀">
        <textarea
          className={inputCls}
          rows={2}
          value={block.title}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </Row>
      <Row label="서브 (Enter 로 줄바꿈)">
        <textarea
          className={inputCls}
          rows={4}
          value={block.subtitle}
          onChange={(e) => patch({ subtitle: e.target.value })}
        />
      </Row>

      <SectionToggle
        title="유의사항"
        visible={block.noticeVisible !== false}
        onToggle={(v) => patch({ noticeVisible: v })}
        titleField={
          <input
            className={inputCls}
            value={block.noticeTitle ?? "유의사항"}
            onChange={(e) => patch({ noticeTitle: e.target.value })}
          />
        }
        itemsField={
          <textarea
            className={inputCls}
            rows={4}
            value={(block.noticeItems ?? []).join("\n")}
            onChange={(e) => patch({ noticeItems: bulletsFromText(e.target.value) })}
          />
        }
      />

      <SectionToggle
        title="웰컴쿠폰 유의사항"
        visible={block.welcomeVisible !== false}
        onToggle={(v) => patch({ welcomeVisible: v })}
        titleField={
          <input
            className={inputCls}
            value={block.welcomeTitle ?? "웰컴쿠폰 유의사항"}
            onChange={(e) => patch({ welcomeTitle: e.target.value })}
          />
        }
        itemsField={
          <textarea
            className={inputCls}
            rows={3}
            value={(block.welcomeItems ?? []).join("\n")}
            onChange={(e) => patch({ welcomeItems: bulletsFromText(e.target.value) })}
          />
        }
      />

      <SectionToggle
        title="첫 주문 감사쿠폰 유의사항"
        visible={block.firstOrderVisible !== false}
        onToggle={(v) => patch({ firstOrderVisible: v })}
        titleField={
          <input
            className={inputCls}
            value={block.firstOrderTitle ?? "첫 주문 감사쿠폰 유의사항"}
            onChange={(e) => patch({ firstOrderTitle: e.target.value })}
          />
        }
        itemsField={
          <textarea
            className={inputCls}
            rows={3}
            value={(block.firstOrderItems ?? []).join("\n")}
            onChange={(e) =>
              patch({ firstOrderItems: bulletsFromText(e.target.value) })
            }
          />
        }
      />
    </div>
  );
}

function SectionToggle({
  title,
  visible,
  onToggle,
  titleField,
  itemsField
}: {
  title: string;
  visible: boolean;
  onToggle: (v: boolean) => void;
  titleField: React.ReactNode;
  itemsField: React.ReactNode;
}) {
  return (
    <div className="my-3 rounded border bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600">{title}</span>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span>{visible ? "노출" : "숨김"}</span>
        </label>
      </div>
      {visible && (
        <>
          <Row label="제목">{titleField}</Row>
          <Row label="항목 (한 줄에 하나)">{itemsField}</Row>
        </>
      )}
    </div>
  );
}
