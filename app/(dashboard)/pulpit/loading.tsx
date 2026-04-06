import { Skeleton } from "@/features/shared/components/Skeleton";

export default function PulpitLoading() {
  return (
    <div className="animate-pulse space-y-10">
      <div>
        <Skeleton variant="text" className="h-9 w-72 max-w-full" />
        <Skeleton variant="text" className="mt-2 h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton variant="card" className="h-36" />
        <Skeleton variant="card" className="h-36" />
        <Skeleton variant="card" className="h-36" />
      </div>
      <Skeleton variant="card" className="h-40 w-full max-w-2xl border-l-[3px] border-brand-gold/30" />
      <div>
        <Skeleton variant="text" className="h-6 w-48" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-24 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
