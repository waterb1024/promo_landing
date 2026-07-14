// 마케팅수신동의(하단) 지자체 프리셋
// 새 지자체 추가는 이 파일에 항목 추가 → 자산은 라이브러리에 role:mkt-consent-card + service:{key} 태그로 업로드
// asset id 는 /api/assets 목록에서 확인 가능.

export type MktConsentRegionKey =
  | "인천"
  | "양산"
  | "울산"
  | "청주";

export type MktConsentRegionPreset = {
  key: MktConsentRegionKey;
  label: string; // 셀렉트에 표시
  serviceLabel: string; // 예: "인천e음"
  brandColor: string; // 브랜드 primary — 뱃지 원, 텍스트 강조에 사용
  badgeCircleColor: string; // 뱃지 원 색상 (brand 와 다를 수 있음)
  guideImageAssetId: string; // /api/assets/{id}/file 로 로드
};

export const MKT_CONSENT_REGIONS: readonly MktConsentRegionPreset[] = [
  {
    key: "인천",
    label: "인천 (인천e음)",
    serviceLabel: "인천e음",
    brandColor: "#F4A106",
    badgeCircleColor: "#F4A106",
    guideImageAssetId: "fa4ed2f640e4"
  },
  {
    key: "양산",
    label: "양산 (양산사랑카드)",
    serviceLabel: "양산사랑카드",
    brandColor: "#6040D0",
    badgeCircleColor: "#F0C000",
    guideImageAssetId: "f08d7ab5aa5b"
  },
  {
    key: "울산",
    label: "울산 (울산페이)",
    serviceLabel: "울산페이",
    brandColor: "#804090",
    badgeCircleColor: "#804090",
    guideImageAssetId: "7b5b7a8c2890"
  },
  {
    key: "청주",
    label: "청주 (청주페이)",
    serviceLabel: "청주페이",
    brandColor: "#30A030",
    badgeCircleColor: "#30A030",
    guideImageAssetId: "3a9c206bb5da"
  }
];

export function findRegion(
  key: string | undefined | null
): MktConsentRegionPreset | undefined {
  if (!key) return undefined;
  return MKT_CONSENT_REGIONS.find((r) => r.key === key);
}

// Apply region preset onto a block payload. Returns a partial patch for
// fields that should be overwritten. Other fields (title, subtitle, notice
// items) are left untouched so the editor can customize them freely.
export function regionPresetPatch(preset: MktConsentRegionPreset): {
  region: MktConsentRegionKey;
  brandColor: string;
  badgeCircleColor: string;
  guideImageUrl: string;
} {
  return {
    region: preset.key,
    brandColor: preset.brandColor,
    badgeCircleColor: preset.badgeCircleColor,
    guideImageUrl: `/api/assets/${preset.guideImageAssetId}/file`
  };
}
