import { Skeleton } from "@/features/shared/components/Skeleton";

export default function PodsumowanieLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-6">
      <Skeleton variant="card" className="h-56 w-full border-t-[3px] border-brand-gold/30" />
      <Skeleton variant="card" className="h-40 w-full" />
      <Skeleton variant="card" className="h-32 w-full" />
    </div>
  );
}
