import { Skeleton } from "@/features/shared/components/Skeleton";

export default function StatystykiLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton variant="text" className="h-9 w-56" />
        <Skeleton variant="text" className="mt-2 h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton variant="card" className="h-40" />
        <Skeleton variant="card" className="h-40" />
        <Skeleton variant="card" className="h-40" />
      </div>
      <Skeleton variant="card" className="h-[280px] w-full" />
    </div>
  );
}
