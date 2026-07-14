import { listPages } from "@/lib/storage";
import { Sidebar } from "./Sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pages = await listPages();
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <Sidebar pages={pages} />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
