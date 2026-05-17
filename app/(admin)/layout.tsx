import { redirect } from "next/navigation";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { getAdminAccessContext } from "@/features/admin/server/adminAuth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ctx = await getAdminAccessContext();
  if (!ctx.user) {
    redirect("/login");
  }

  if (!ctx.allowed) {
    redirect("/pulpit");
  }

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-background">
      <AdminSidebar />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="mx-auto max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
