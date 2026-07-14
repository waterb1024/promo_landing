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

export function Editor({ initial }: { initial: DetailPage }) {
  const router = useRouter();
  const [page, setPage] = useState<DetailPage>(initial);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    initial.blocks[0]?.id ?? null
  );
  const initialJson = useRef(JSON.stringify(initial));

  useEffect(() => {
    setDirty(JSON.stringify(page) !== initialJson.current);
  }, [page]);

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
      router.refresh();
    } else {
      alert("저장 실패");
    }
  };

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
            {page.status} {dirty ? "· 변경사항 있음" : ""}
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
                  {page.blocks.map((b, i) => (
                    <li
                      key={b.id}
                      className={`flex items-center justify-between border-b px-3 py-2 text-sm ${
                        b.id === selectedId ? "bg-blue-50" : ""
                      }`}
                    >
                      <button
                        onClick={() => setSelectedId(b.id)}
                        className="flex-1 text-left"
                      >
                        <span className="mr-2 text-xs text-gray-400">{i + 1}.</span>
                        {BLOCK_TYPE_META[b.type].name}
                      </button>
                      <div className="flex gap-1 text-xs">
                        <button
                          onClick={() => moveBlock(b.id, -1)}
                          className="rounded border px-1"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveBlock(b.id, 1)}
                          className="rounded border px-1"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeBlock(b.id)}
                          className="rounded border px-1 text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
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
              {page.blocks.map((b) => (
                <RenderBlock key={b.id} block={b} />
              ))}
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
