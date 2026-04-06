import { Skeleton } from "@/features/shared/components/Skeleton";

export default function SubjectDashboardLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div>
        <Skeleton variant="text" className="h-4 w-40" />
        <Skeleton variant="text" className="mt-4 h-10 w-2/3 max-w-md" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="card" className="h-24" />
        ))}
      </div>
      <Skeleton variant="card" className="min-h-[200px] w-full border-l-[3px] border-brand-gold/30" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="card" className="h-20" />
        ))}
      </div>
    </div>
  );
}
