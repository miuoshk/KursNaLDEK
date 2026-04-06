import { Skeleton } from "@/features/shared/components/Skeleton";

export default function OsiagnieciaLoading() {
  return (
    <div className="space-y-10">
      <div>
        <Skeleton variant="text" className="h-9 w-56" />
        <Skeleton variant="text" className="mt-2 h-4 w-96 max-w-full" />
      </div>
      <Skeleton variant="card" className="h-48 w-full" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="card" className="h-36" />
        ))}
      </div>
    </div>
  );
}
