import { loadPulpit } from "@/features/pulpit/server/loadPulpit";
import { PulpitDashboard } from "@/features/pulpit/components/PulpitDashboard";
import { requireAnyEntitlementOrRedirect } from "@/features/access/server/guards";

export default async function PulpitPage() {
  await requireAnyEntitlementOrRedirect();
  const res = await loadPulpit();
  if (!res.ok) {
    return (
      <div className="font-body text-body-md text-secondary">
        <p>{res.message}</p>
      </div>
    );
  }
  return <PulpitDashboard data={res.data} />;
}
