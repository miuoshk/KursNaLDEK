import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SessionPageClient } from "@/features/session/components/SessionPageClient";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function SesjaPage({ params }: PageProps) {
  const { sessionId } = await params;

  if (sessionId !== "new") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: session } = await supabase
        .from("study_sessions")
        .select("is_completed")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (session?.is_completed) {
        redirect(`/sesja/${sessionId}/podsumowanie`);
      }
    }
  }

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
