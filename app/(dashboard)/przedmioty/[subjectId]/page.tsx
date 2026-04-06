import { notFound } from "next/navigation";
import { BreadcrumbSubjectSegment } from "@/features/subjects/components/BreadcrumbSubjectSegment";
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

  const { subject, topics } = result;

  return (
    <div>
      <BreadcrumbSubjectSegment shortName={subject.short_name} />
      <h1 className="font-heading text-heading-xl text-primary">{subject.name}</h1>

      <div className="mt-8 space-y-8">
        <StatsRow />
        <SmartSessionCTA subjectId={subject.id} />
        <TopicGrid topics={topics} />
      </div>
    </div>
  );
}
