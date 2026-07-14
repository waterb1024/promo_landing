"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import type { DetailPage } from "@/lib/blocks/types";
import { SERVICES } from "@/lib/services";

export function Sidebar({ pages }: { pages: DetailPage[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [q, setQ] = useState("");

  const activeId = useMemo(() => {
    const m = pathname.match(/^\/admin\/pages\/([^/]+)/);
    return m ? m[1] : null;
  }, [pathname]);

  const filtered = pages.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (q) {
      const hay = `${p.title} ${p.service}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const remove = async (p: DetailPage, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const label = p.title || "(제목 없음)";
    if (!confirm(`"${label}" 페이지를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    setBusy(true);
    const res = await fetch(`/api/pages/${p.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      alert("삭제 실패");
      return;
    }
    if (p.id === activeId) router.push("/admin");
    router.refresh();
  };

  const create = async (service?: string) => {
    setBusy(true);
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id,
        title: service ? `${service} 상세페이지` : "새 상세페이지",
        service: service ?? "",
        status: "draft",
        blocks: []
      })
    });
    setBusy(false);
    if (res.ok) {
      router.push(`/admin/pages/${id}`);
      router.refresh();
    } else {
      alert("생성 실패");
    }
  };

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r bg-gray-50">
      <header className="border-b bg-white px-4 py-3">
        <Link href="/admin" className="block text-sm font-bold text-gray-900">
          Landing CMS
        </Link>
      </header>

      <div className="border-b bg-white p-3">
        <div className="mb-2 text-[11px] font-semibold text-gray-500">
          서비스 선택 후 생성
        </div>
        <div className="mb-2 grid grid-cols-2 gap-1">
          {SERVICES.map((s) => (
            <button
              key={s.key}
              onClick={() => create(s.service)}
              disabled={busy}
              className="rounded border bg-white px-2 py-1.5 text-xs hover:border-blue-500 hover:bg-blue-50 disabled:opacity-40"
              title={s.service}
            >
              + {s.key}
            </button>
          ))}
        </div>
        <button
          onClick={() => create()}
          disabled={busy}
          className="w-full rounded border bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {busy ? "생성 중…" : "+ 빈 페이지 (서비스 미지정)"}
        </button>
      </div>

      <div className="border-b bg-white px-3 py-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목·서비스 검색"
          className="mb-2 w-full rounded border px-2 py-1 text-xs"
        />
        <div className="flex gap-1 text-xs">
          {(["all", "draft", "published"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`flex-1 rounded border px-2 py-1 ${
                filter === k
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {k === "all" ? "전체" : k === "draft" ? "초안" : "발행"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-xs text-gray-400">페이지가 없습니다</p>
        ) : (
          <ul>
            {filtered.map((p) => {
              const active = p.id === activeId;
              return (
                <li key={p.id} className="group relative">
                  <Link
                    href={`/admin/pages/${p.id}`}
                    className={`flex flex-col gap-1 border-b border-gray-100 px-4 py-3 pr-10 text-sm transition ${
                      active
                        ? "bg-blue-50 border-l-2 border-l-blue-500"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="truncate font-medium text-gray-900">
                      {p.title || "(제목 없음)"}
                    </span>
                    <span className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span
                        className={`inline-block rounded px-1.5 py-[1px] text-[10px] font-medium ${
                          p.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {p.status === "published" ? "발행" : "초안"}
                      </span>
                      <span>{p.service || "서비스 미지정"}</span>
                      <span>· {p.blocks.length}개</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => remove(p, e)}
                    disabled={busy}
                    title="삭제"
                    aria-label={`${p.title || "페이지"} 삭제`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-xs text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:pointer-events-none"
                  >
                    🗑
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
