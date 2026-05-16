import { redirect } from "next/navigation";
import { requireAnyEntitlementOrRedirect } from "@/features/access/server/guards";

export default async function DashboardRootPage() {
  await requireAnyEntitlementOrRedirect();
  redirect("/pulpit");
}
