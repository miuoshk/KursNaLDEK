import { Skeleton } from "@/features/shared/components/Skeleton";

export default function UstawieniaLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-2">
      <Skeleton variant="text" className="h-8 w-48" />
      <Skeleton variant="card" className="h-40 w-full" />
      <Skeleton variant="card" className="h-32 w-full" />
      <Skeleton variant="card" className="h-48 w-full" />
    </div>
  );
}
