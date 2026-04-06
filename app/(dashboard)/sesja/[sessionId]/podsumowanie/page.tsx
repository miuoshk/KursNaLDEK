import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionSummaryLoader } from "@/features/session/components/SessionSummaryLoader";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function SessionSummaryPage({ params }: PageProps) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: session } = await supabase
    .from("study_sessions")
    .select("is_completed")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!session) {
    redirect("/przedmioty");
  }

  if (!session.is_completed) {
    redirect(`/sesja/${sessionId}`);
  }

  return <SessionSummaryLoader sessionId={sessionId} />;
}
