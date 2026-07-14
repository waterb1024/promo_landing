"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RenderBlock } from "@/lib/blocks/registry";
import {
  BLOCK_TYPE_META,
  defaultBlock,
  type BlockType,
  type DetailPage
} from "@/lib/blocks/types";
import { BlockFields } from "./BlockFields";

function newBlockId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

function formatRelativeTime(d: Date): string {
  const now = Date.now();
  const diff = Math.max(0, now - d.getTime());
  if (diff < 5_000) return "방금";
  if (diff < 60_000) return `${Math.round(diff / 1000)}초 전`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}분 전`;
  return `${Math.round(diff / 3_600_000)}시간 전`;
}

export function Editor({ initial }: { initial: DetailPage }) {
  const router = useRouter();
  const [page, setPage] = useState<DetailPage>(initial);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [nowTick, setNowTick] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(
    initial.blocks[0]?.id ?? null
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const initialJson = useRef(JSON.stringify(initial));

  useEffect(() => {
    setDirty(JSON.stringify(page) !== initialJson.current);
  }, [page]);

  // 상대시간 표시 주기적 리렌더 (10초마다)
  useEffect(() => {
    if (!lastSavedAt) return;
    const t = setInterval(() => setNowTick((n) => n + 1), 10_000);
    return () => clearInterval(t);
  }, [lastSavedAt]);

  const selected = page.blocks.find((b) => b.id === selectedId) ?? null;

  const patch = (updater: (p: DetailPage) => DetailPage) => setPage(updater);

  const addBlock = (type: BlockType["type"]) => {
    const block = defaultBlock(type);
    patch((p) => ({ ...p, blocks: [...p.blocks, block] }));
    setSelectedId(block.id);
  };

  const updateBlock = (id: string, next: BlockType) => {
    patch((p) => ({
      ...p,
      blocks: p.blocks.map((b) => (b.id === id ? next : b))
    }));
  };

  const removeBlock = (id: string) => {
    patch((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    patch((p) => {
      const idx = p.blocks.findIndex((b) => b.id === id);
      if (idx < 0) return p;
      const target = idx + dir;
      if (target < 0 || target >= p.blocks.length) return p;
      const next = [...p.blocks];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return { ...p, blocks: next };
    });
  };

  const duplicateBlock = (id: string) => {
    patch((p) => {
      const idx = p.blocks.findIndex((b) => b.id === id);
      if (idx < 0) return p;
      const clone = { ...p.blocks[idx], id: newBlockId() };
      const next = [...p.blocks];
      next.splice(idx + 1, 0, clone);
      return { ...p, blocks: next };
    });
    // 새로 복제된 블록을 선택하려면 next id 를 미리 알아야 함 — 위의 clone.id 는 클로저 내부.
    // 실용상 원본 유지가 자연스러우므로 selection 은 그대로.
  };

  const reorderBlocks = (from: number, to: number) => {
    if (from === to) return;
    patch((p) => {
      if (from < 0 || from >= p.blocks.length) return p;
      if (to < 0 || to > p.blocks.length) return p;
      const next = [...p.blocks];
      const [moved] = next.splice(from, 1);
      // splice 이후 to 인덱스 재계산: from < to 이면 target-1
      const target = from < to ? to - 1 : to;
      next.splice(target, 0, moved);
      return { ...p, blocks: next };
    });
  };

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/pages/${page.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(page)
    });
    setSaving(false);
    if (res.ok) {
      const { page: saved } = await res.json();
      initialJson.current = JSON.stringify(saved);
      setPage(saved);
      setDirty(false);
      setLastSavedAt(new Date());
      router.refresh();
    } else {
      alert("저장 실패");
    }
  };

  // 자동 저장 — dirty 상태에서 1s debounce 후 저장.
  // page 가 계속 바뀌면 effect 재실행되며 이전 timer 취소 → 자연스러운 debounce.
  useEffect(() => {
    if (!dirty || saving) return;
    const timer = setTimeout(() => {
      save();
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, dirty, saving]);

  const publish = async () => {
    const next = { ...page, status: "published" as const };
    setPage(next);
    setSaving(true);
    const res = await fetch(`/api/pages/${next.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next)
    });
    setSaving(false);
    if (res.ok) {
      const { page: saved } = await res.json();
      initialJson.current = JSON.stringify(saved);
      setPage(saved);
      setDirty(false);
      setLastSavedAt(new Date());
      router.refresh();
    }
  };

  const exportPng = async () => {
    const url = `/api/pages/${page.id}/export`;
    window.open(url, "_blank");
  };

  const previewScale = 0.32;

  const blockTypes = useMemo(
    () => Object.entries(BLOCK_TYPE_META),
    []
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <input
            value={page.title}
            onChange={(e) => patch((p) => ({ ...p, title: e.target.value }))}
            className="rounded border px-2 py-1 text-sm"
            placeholder="페이지 제목"
          />
          <input
            value={page.service}
            onChange={(e) => patch((p) => ({ ...p, service: e.target.value }))}
            className="w-40 rounded border px-2 py-1 text-sm"
            placeholder="서비스 (예: 인천사랑상품권)"
          />
          <span className="text-xs text-gray-500">
            {page.status}
            {" · "}
            {saving
              ? "저장 중…"
              : dirty
                ? "곧 저장…"
                : lastSavedAt
                  ? `저장됨 · ${formatRelativeTime(lastSavedAt)}`
                  : "저장됨"}
            {/* nowTick 로 상대시간 리렌더 트리거 */}
            <span className="hidden">{nowTick}</span>
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportPng}
            className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
            title="랜딩 규칙에 맞춰 ZIP (메인 + 블록별 img_01..) 다운로드"
          >
            ZIP 익스포트
          </button>
          <Link
            href={`/render/${page.id}`}
            target="_blank"
            className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            미리보기 새 창
          </Link>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white disabled:opacity-40"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
          <button
            onClick={publish}
            disabled={saving}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            발행
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 좌측: 블록 리스트 + 편집 폼 */}
        <div className="flex w-[520px] shrink-0 flex-col overflow-hidden border-r bg-gray-50">
          <div className="border-b bg-white p-3">
            <div className="mb-2 text-xs font-semibold text-gray-500">블록 추가</div>
            <div className="flex flex-wrap gap-2">
              {blockTypes.map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => addBlock(key as BlockType["type"])}
                  className="rounded border bg-white px-2 py-1 text-xs hover:border-blue-500"
                  title={meta.description}
                >
                  + {meta.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="border-b bg-white">
              {page.blocks.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-400">
                  블록을 추가하세요
                </div>
              ) : (
                <ul>
                  {page.blocks.map((b, i) => {
                    const isDragging = dragIndex === i;
                    const isDropTarget =
                      dropIndex === i && dragIndex !== null && dragIndex !== i;
                    return (
                      <li
                        key={b.id}
                        draggable
                        onDragStart={(e) => {
                          setDragIndex(i);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => {
                          if (dragIndex === null) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (dropIndex !== i) setDropIndex(i);
                        }}
                        onDragEnd={() => {
                          setDragIndex(null);
                          setDropIndex(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (dragIndex === null) return;
                          const from = dragIndex;
                          const to = i > from ? i + 1 : i;
                          reorderBlocks(from, to);
                          setDragIndex(null);
                          setDropIndex(null);
                        }}
                        className={`flex items-center justify-between border-b px-3 py-2 text-sm transition ${
                          b.id === selectedId ? "bg-blue-50" : ""
                        } ${isDragging ? "opacity-40" : ""} ${
                          isDropTarget
                            ? "border-t-2 border-t-blue-500"
                            : ""
                        }`}
                      >
                        <span
                          className="mr-2 cursor-grab select-none text-gray-300"
                          title="드래그해서 순서 변경"
                        >
                          ⋮⋮
                        </span>
                        <button
                          onClick={() => setSelectedId(b.id)}
                          className="flex-1 text-left"
                        >
                          <span className="mr-2 text-xs text-gray-400">
                            {i + 1}.
                          </span>
                          {BLOCK_TYPE_META[b.type].name}
                        </button>
                        <div className="flex gap-1 text-xs">
                          <button
                            onClick={() => moveBlock(b.id, -1)}
                            className="rounded border px-1"
                            title="위로"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveBlock(b.id, 1)}
                            className="rounded border px-1"
                            title="아래로"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => duplicateBlock(b.id)}
                            className="rounded border px-1 text-gray-600"
                            title="복제"
                          >
                            ⧉
                          </button>
                          <button
                            onClick={() => removeBlock(b.id)}
                            className="rounded border px-1 text-red-500"
                            title="삭제"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="p-3">
              {selected ? (
                <BlockFields
                  block={selected}
                  onChange={(next) => updateBlock(selected.id, next)}
                />
              ) : (
                <p className="text-sm text-gray-500">
                  좌측 목록에서 블록을 선택하면 편집할 수 있습니다.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 우측: 프리뷰 */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div className="mx-auto" style={{ width: 1080 * previewScale }}>
            <div className="mb-2 text-center text-xs text-gray-500">
              모바일 프리뷰 (1080px 기준, {Math.round(previewScale * 100)}%)
            </div>
            <div
              className="origin-top-left overflow-hidden rounded border bg-white shadow-lg"
              style={{
                width: 1080,
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
                marginBottom: 16
              }}
            >
              {page.blocks.map((b) => {
                const isSelected = b.id === selectedId;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedId(b.id)}
                    style={{
                      position: "relative",
                      outline: isSelected
                        ? "6px solid #eab308"
                        : "none",
                      outlineOffset: -6,
                      cursor: "pointer"
                    }}
                  >
                    <RenderBlock block={b} />
                  </div>
                );
              })}
              {page.blocks.length === 0 ? (
                <div className="p-20 text-center text-3xl text-gray-300">
                  (블록을 추가하면 여기 나타납니다)
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
