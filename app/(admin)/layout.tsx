import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
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
