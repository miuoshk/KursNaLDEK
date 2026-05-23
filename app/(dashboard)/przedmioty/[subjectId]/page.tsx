import { notFound } from "next/navigation";
import { BreadcrumbSubjectSegment } from "@/features/subjects/components/BreadcrumbSubjectSegment";
import { ResetSubjectProgress } from "@/features/subjects/components/ResetSubjectProgress";
import { SmartSessionCTA } from "@/features/subjects/components/SmartSessionCTA";
import { StatsRow } from "@/features/subjects/components/StatsRow";
import { TopicGrid } from "@/features/subjects/components/TopicGrid";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import { loadSubjectDashboard } from "@/features/subjects/server/loadSubjectDashboard";
import { getPreferredSessionCount } from "@/features/session/lib/sessionCount";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ subjectId: string }>;
};

export default async function SubjectDashboardPage({ params }: PageProps) {
  const { subjectId } = await params;
  const result = await loadSubjectDashboard(subjectId);

  if (!result.ok) {
    if (result.kind === "not_found") {
      notFound();
    }
    return (
      <div>
        <PrzedmiotyError message={result.message} />
      </div>
    );
  }

  const { subject, topics, stats } = result;
  const availableQuestionCount = topics.reduce((s, t) => s + t.question_count, 0);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getProfileByUserId(user.id) : null;
  const initialSessionCount = getPreferredSessionCount(profile);

  return (
    <div>
      <BreadcrumbSubjectSegment shortName={subject.short_name} />
      <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
        {subject.name}
      </h1>

      <div className="mt-8 space-y-8">
        <StatsRow stats={stats} />
        {availableQuestionCount > 0 ? (
          <SmartSessionCTA
            subjectId={subject.id}
            availableQuestionCount={availableQuestionCount}
            initialSessionCount={initialSessionCount}
          />
        ) : (
          <p className="font-body text-body-sm text-muted">
            Brak aktywnych pytań w tym przedmiocie.
          </p>
        )}
        <TopicGrid
          topics={topics}
          subjectId={subject.id}
          subjectShortName={subject.short_name}
          initialSessionCount={initialSessionCount}
        />

        <div className="flex justify-end pt-4">
          <ResetSubjectProgress
            subjectId={subject.id}
            subjectName={subject.name}
          />
        </div>
      </div>
    </div>
  );
}
