import { notFound } from "next/navigation";
import { getPage } from "@/lib/storage";
import { Editor } from "./Editor";

export const dynamic = "force-dynamic";

export default async function EditPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await getPage(id);
  if (!page) notFound();
  return <Editor initial={page} />;
}
