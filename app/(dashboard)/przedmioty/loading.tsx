import { Skeleton } from "@/features/shared/components/Skeleton";

export default function PrzedmiotyLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton variant="text" className="h-9 w-64" />
        <Skeleton variant="text" className="mt-2 h-4 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton variant="card" className="h-36" />
        <Skeleton variant="card" className="h-36" />
        <Skeleton variant="card" className="h-36" />
      </div>
    </div>
  );
}
