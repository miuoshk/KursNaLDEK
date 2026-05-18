import { redirect } from "next/navigation";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { AdminTopBar } from "@/features/admin/components/AdminTopBar";
import { getAdminAccessContext } from "@/features/admin/server/adminAuth";
import { loadAdminSidebarBadges } from "@/features/admin/server/loadAdminSidebarBadges";
import { createClient } from "@/lib/supabase/server";

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

  const [badges, profileRes] = await Promise.all([
    loadAdminSidebarBadges(),
    (async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("profiles")
        .select("display_name, full_name")
        .eq("id", ctx.user.id)
        .maybeSingle();
      return data;
    })(),
  ]);

  const displayName =
    (profileRes?.display_name as string | null)?.trim() ||
    (profileRes?.full_name as string | null)?.trim() ||
    ctx.user.email?.split("@")[0] ||
    "Admin";

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-background">
      <AdminSidebar
        badges={badges}
        user={{
          displayName,
          email: ctx.user.email ?? null,
          role: ctx.role,
        }}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminTopBar role={ctx.role} />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
