import { notFound } from "next/navigation";
import { BreadcrumbSubjectSegment } from "@/features/subjects/components/BreadcrumbSubjectSegment";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import { SubjectDashboardClient } from "@/features/subjects/components/SubjectDashboardClient";
import { loadSubjectDashboard } from "@/features/subjects/server/loadSubjectDashboard";
import { getPreferredSessionCount } from "@/features/session/lib/sessionCount";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { createClient } from "@/lib/supabase/server";
import { countSessionAnswersTodayWarsaw } from "@/features/pulpit/server/countQuestionsToday";
import { loadDailyPlan } from "@/features/session/server/loadDailyPlan";

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

  const {
    subject,
    topics,
    stats,
    sourceCounts,
    statsBySource,
    sourceAccuracy,
  } = result;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [profile, questionsToday] = user
    ? await Promise.all([
        getProfileByUserId(user.id),
        countSessionAnswersTodayWarsaw(supabase, user.id),
      ])
    : [null, 0];
  const initialSessionCount = getPreferredSessionCount(profile);
  const dailyPlan = user
    ? await loadDailyPlan(supabase, user.id, profile, {
        dueCount: stats.dueCount,
        questionsToday,
        maxQuestions: stats.totalQuestions,
        subjectId: subject.id,
      })
    : null;
  const profileDefaultSource =
    typeof profile?.default_question_source === "string"
      ? profile.default_question_source
      : null;

  return (
    <div>
      <BreadcrumbSubjectSegment shortName={subject.short_name} />
      <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
        {subject.name}
      </h1>

      <SubjectDashboardClient
        subject={subject}
        topics={topics}
        stats={stats}
        sourceCounts={sourceCounts}
        statsBySource={statsBySource}
        sourceAccuracy={sourceAccuracy}
        initialSessionCount={initialSessionCount}
        profileDefaultSource={profileDefaultSource}
        dailyPlan={dailyPlan}
      />
    </div>
  );
}
