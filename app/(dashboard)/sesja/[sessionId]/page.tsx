import { Suspense } from "react";
import { SessionPageClient } from "@/features/session/components/SessionPageClient";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function SesjaPage({ params }: PageProps) {
  const { sessionId } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center font-body text-body-md text-secondary">
          Ładowanie sesji…
        </div>
      }
    >
      <SessionPageClient sessionId={sessionId} />
    </Suspense>
  );
}
