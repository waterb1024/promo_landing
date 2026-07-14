import { listPages } from "@/lib/storage";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminEmpty() {
  const pages = await listPages();
  const recent = pages[0];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-gray-50 p-8 text-center">
      <div className="text-4xl">📄</div>
      <h1 className="text-lg font-semibold text-gray-800">
        왼쪽 목록에서 페이지를 선택하거나 새로 만들어보세요.
      </h1>
      <p className="max-w-md text-sm text-gray-500">
        블록을 조합해 상세페이지를 만들고, 미리보기로 확인한 뒤 PNG 로 익스포트할 수 있습니다.
      </p>
      {recent ? (
        <Link
          href={`/admin/pages/${recent.id}`}
          className="mt-4 rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:border-gray-400"
        >
          최근 페이지로 이동 → {recent.title}
        </Link>
      ) : null}
    </div>
  );
}
