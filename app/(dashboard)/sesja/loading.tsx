import { Skeleton } from "@/features/shared/components/Skeleton";

export default function SesjaLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div>
        <Skeleton variant="text" className="h-10 w-56 max-w-full" />
        <Skeleton variant="text" className="mt-2 h-4 w-80 max-w-full" />
      </div>
      <ul className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="card" className="h-28 w-full" />
        ))}
      </ul>
      <Skeleton variant="card" className="h-36 w-full border-l-[3px] border-brand-gold/30" />
    </div>
  );
}
