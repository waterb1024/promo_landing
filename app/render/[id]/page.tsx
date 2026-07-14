import { notFound } from "next/navigation";
import { getPage } from "@/lib/storage";
import { RenderBlock } from "@/lib/blocks/registry";

export const dynamic = "force-dynamic";

export default async function RenderPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ export?: string }>;
}) {
  const { id } = await params;
  const { export: exportMode } = await searchParams;
  const page = await getPage(id);
  if (!page) notFound();

  const isExport = exportMode === "1";

  return (
    <>
      {isExport ? (
        <style>{`
          nextjs-portal, [data-nextjs-dialog-overlay], [data-next-badge-root], #__next-build-watcher { display: none !important; }
          body { background: #ffffff; }
        `}</style>
      ) : null}
      <div
        data-page-id={page.id}
        data-render-container
        style={{
          width: 1080,
          minHeight: 100,
          margin: isExport ? 0 : "0 auto",
          background: "#ffffff",
          overflow: "hidden"
        }}
      >
        {page.blocks.map((block, i) => (
          <div
            key={block.id}
            data-block-slot
            data-block-id={block.id}
            data-block-index={i}
            data-block-type={block.type}
          >
            <RenderBlock block={block} />
          </div>
        ))}
      </div>
    </>
  );
}
