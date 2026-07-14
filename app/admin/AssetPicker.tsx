"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Asset, AssetKind } from "@/lib/assets";

type Tab = "library" | "upload" | "generate";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
  initialTab?: Tab;
  filterKind?: AssetKind | "all";
};

export function AssetPicker({
  open,
  onClose,
  onSelect,
  initialTab = "library",
  filterKind = "all"
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[80vh] w-[900px] max-w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex gap-1">
            <TabButton active={tab === "library"} onClick={() => setTab("library")}>
              라이브러리
            </TabButton>
            <TabButton active={tab === "upload"} onClick={() => setTab("upload")}>
              업로드
            </TabButton>
            <TabButton active={tab === "generate"} onClick={() => setTab("generate")}>
              AI 생성
            </TabButton>
          </div>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            ✕ 닫기
          </button>
        </header>
        <div className="flex-1 overflow-hidden">
          {tab === "library" && (
            <LibraryTab onSelect={onSelect} filterKind={filterKind} />
          )}
          {tab === "upload" && (
            <UploadTab
              onDone={(asset) => {
                onSelect(asset);
              }}
              onSwitchToLibrary={() => setTab("library")}
            />
          )}
          {tab === "generate" && (
            <GenerateTab
              onDone={(asset) => {
                onSelect(asset);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-3 py-1.5 text-sm ${
        active
          ? "bg-gray-900 text-white"
          : "border text-gray-600 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function LibraryTab({
  onSelect,
  filterKind
}: {
  onSelect: (asset: Asset) => void;
  filterKind: AssetKind | "all";
}) {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [kind, setKind] = useState<AssetKind | "all">(filterKind);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    const url = kind === "all" ? "/api/assets" : `/api/assets?kind=${kind}`;
    const res = await fetch(url);
    const data = (await res.json()) as { assets: Asset[] };
    setAssets(data.assets);
  }, [kind]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = (assets ?? []).filter((a) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      a.tags.some((t) => t.toLowerCase().includes(q)) ||
      (a.prompt ?? "").toLowerCase().includes(q) ||
      a.filename.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as AssetKind | "all")}
          className="rounded border px-2 py-1 text-sm"
        >
          <option value="all">전체</option>
          <option value="upload">업로드</option>
          <option value="ai">AI 생성</option>
          <option value="template">템플릿</option>
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="태그 · 파일명 · 프롬프트 검색"
          className="flex-1 rounded border px-2 py-1 text-sm"
        />
        <button
          onClick={load}
          className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
        >
          새로고침
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {assets === null ? (
          <div className="text-center text-sm text-gray-400">불러오는 중…</div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center text-sm text-gray-400">
            자산이 없습니다. 업로드하거나 AI 생성 탭을 이용하세요.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {filtered.map((a) => (
              <button
                key={a.id}
                onClick={() => onSelect(a)}
                className="group flex flex-col overflow-hidden rounded border text-left hover:border-blue-500"
              >
                <div className="aspect-square w-full overflow-hidden bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/assets/${a.id}/file`}
                    alt={a.prompt ?? a.filename}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="border-t p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                      {a.kind}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {a.width && a.height ? `${a.width}×${a.height}` : ""}
                    </span>
                  </div>
                  {a.tags.length > 0 && (
                    <div className="mt-1 truncate text-[10px] text-gray-500">
                      #{a.tags.join(" #")}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UploadTab({
  onDone,
  onSwitchToLibrary
}: {
  onDone: (asset: Asset) => void;
  onSwitchToLibrary: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set("file", file);
    form.set("kind", "upload");
    if (tags.trim()) form.set("tags", tags);
    const res = await fetch("/api/assets/upload", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? `업로드 실패 (${res.status})`);
      return;
    }
    const { asset } = (await res.json()) as { asset: Asset };
    onDone(asset);
  };

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div
        onClick={() => inputRef.current?.click()}
        className="flex h-56 cursor-pointer items-center justify-center rounded border-2 border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500"
      >
        {file ? (
          <div className="text-center">
            <div className="text-base text-gray-800">{file.name}</div>
            <div className="mt-1 text-xs text-gray-500">
              {(file.size / 1024).toFixed(1)} KB · {file.type}
            </div>
          </div>
        ) : (
          <span>클릭해서 파일 선택 (PNG · JPG · WebP · GIF · SVG, 20MB 이하)</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="hidden"
      />
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold text-gray-600">
          태그 (쉼표 구분)
        </span>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="예: 인천사랑상품권, 히어로"
          className="w-full rounded border px-2 py-1.5 text-sm"
        />
      </label>
      {error && <div className="text-sm text-red-500">{error}</div>}
      <div className="flex justify-end gap-2">
        <button
          onClick={onSwitchToLibrary}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          라이브러리 보기
        </button>
        <button
          disabled={!file || busy}
          onClick={submit}
          className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white disabled:opacity-40"
        >
          {busy ? "업로드 중…" : "업로드"}
        </button>
      </div>
    </div>
  );
}

const AI_SIZES: Array<{ label: string; w: number; h: number }> = [
  { label: "1080 × 1000 (Hero)", w: 1080, h: 1000 },
  { label: "1024 × 1024 (정사각)", w: 1024, h: 1024 },
  { label: "1024 × 1536 (세로)", w: 1024, h: 1536 },
  { label: "1536 × 1024 (가로)", w: 1536, h: 1024 }
];

function GenerateTab({ onDone }: { onDone: (asset: Asset) => void }) {
  const [subject, setSubject] = useState("");
  const [texts, setTexts] = useState("");
  const [style, setStyle] = useState("illustration");
  const [kind, setKind] = useState("popup");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [tags, setTags] = useState("");
  const [extraHint, setExtraHint] = useState("");
  const [transparent, setTransparent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const size = AI_SIZES[sizeIdx];
    const body = {
      subject: subject.trim() || undefined,
      texts: texts
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean),
      style,
      kind,
      width: size.w,
      height: size.h,
      extra_hint: extraHint.trim() || undefined,
      transparent_background: transparent,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    };
    const res = await fetch("/api/assets/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? `생성 실패 (${res.status})`);
      return;
    }
    const { asset } = (await res.json()) as { asset: Asset };
    onDone(asset);
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-6">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold text-gray-600">
            주제 (subject)
          </span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="예: 소상공인 카드결제수수료 환급"
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold text-gray-600">
            사이즈
          </span>
          <select
            value={sizeIdx}
            onChange={(e) => setSizeIdx(Number(e.target.value))}
            className="w-full rounded border px-2 py-1.5 text-sm"
          >
            {AI_SIZES.map((s, i) => (
              <option key={s.label} value={i}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold text-gray-600">
            스타일
          </span>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full rounded border px-2 py-1.5 text-sm"
          >
            <option value="illustration">일러스트</option>
            <option value="photo">사진</option>
            <option value="flat">플랫</option>
            <option value="3d">3D</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold text-gray-600">
            타입
          </span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="w-full rounded border px-2 py-1.5 text-sm"
          >
            <option value="popup">popup</option>
            <option value="banner">banner</option>
            <option value="hero">hero</option>
            <option value="icon">icon</option>
          </select>
        </label>
      </div>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-semibold text-gray-600">
          이미지에 넣을 텍스트 (한 줄에 하나, 선택)
        </span>
        <textarea
          value={texts}
          onChange={(e) => setTexts(e.target.value)}
          rows={2}
          className="w-full rounded border px-2 py-1.5 text-sm"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-semibold text-gray-600">
          추가 힌트 (선택)
        </span>
        <textarea
          value={extraHint}
          onChange={(e) => setExtraHint(e.target.value)}
          rows={2}
          placeholder="예: 파스텔톤, 인천 랜드마크 실루엣"
          className="w-full rounded border px-2 py-1.5 text-sm"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold text-gray-600">
            태그
          </span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="쉼표 구분"
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="mt-6 inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={transparent}
            onChange={(e) => setTransparent(e.target.checked)}
          />
          투명 배경
        </label>
      </div>
      {error && <div className="text-sm text-red-500">{error}</div>}
      <div className="flex justify-end">
        <button
          disabled={busy}
          onClick={submit}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {busy ? "생성 중… (최대 2분)" : "AI 생성"}
        </button>
      </div>
    </div>
  );
}
