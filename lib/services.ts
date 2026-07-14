// 지자체 · 서비스 프리셋 공유 config.
// 페이지 생성 · 편집 · 마케팅수신동의 블록 등에서 재사용.
// 새 서비스 추가는 여기에 항목 하나 넣으면 자동 전파.

export type ServicePreset = {
  key: string; // 짧은 식별자 (인천, 양산...)
  service: string; // 페이지 service 필드에 저장될 실제 이름
  label: string; // 셀렉트에 표시
};

export const SERVICES: readonly ServicePreset[] = [
  { key: "인천", service: "인천e음", label: "인천 (인천e음)" },
  { key: "양산", service: "양산사랑카드", label: "양산 (양산사랑카드)" },
  { key: "울산", service: "울산페이", label: "울산 (울산페이)" },
  { key: "청주", service: "청주페이", label: "청주 (청주페이)" }
];

export function findServiceByKey(key: string): ServicePreset | undefined {
  return SERVICES.find((s) => s.key === key);
}

export function findServiceByName(name: string): ServicePreset | undefined {
  return SERVICES.find((s) => s.service === name);
}
