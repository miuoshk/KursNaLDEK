import { notFound } from "next/navigation";
import { BreadcrumbSubjectSegment } from "@/features/subjects/components/BreadcrumbSubjectSegment";
import { ResetSubjectProgress } from "@/features/subjects/components/ResetSubjectProgress";
import { SmartSessionCTA } from "@/features/subjects/components/SmartSessionCTA";
import { StatsRow } from "@/features/subjects/components/StatsRow";
import { TopicGrid } from "@/features/subjects/components/TopicGrid";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import { loadSubjectDashboard } from "@/features/subjects/server/loadSubjectDashboard";

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

  return (
    <div>
      <BreadcrumbSubjectSegment shortName={subject.short_name} />
      <h1 className="font-heading text-heading-xl text-primary">{subject.name}</h1>

      <div className="mt-8 space-y-8">
        <StatsRow stats={stats} />
        <SmartSessionCTA
          subjectId={subject.id}
          availableQuestionCount={availableQuestionCount}
        />
        <TopicGrid topics={topics} subjectId={subject.id} subjectShortName={subject.short_name} />

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
