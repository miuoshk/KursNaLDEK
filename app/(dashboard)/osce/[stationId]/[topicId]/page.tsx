import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OsceBreadcrumbSetter } from "@/features/osce/components/OsceBreadcrumbSetter";
import { OsceExamTasksBox } from "@/features/osce/components/OsceExamTasksBox";
import { TopicSession } from "@/features/osce/components/TopicSession";
import { createOsceTopicSession } from "@/features/osce/server/createOsceTopicSession";
import { loadOsceStation } from "@/features/osce/server/loadOsceStation";
import { loadTopicSessionData } from "@/features/osce/server/loadTopicSessionData";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";

type PageProps = {
  params: Promise<{ stationId: string; topicId: string }>;
};

export default async function OsceTopicSessionPage({ params }: PageProps) {
  const { stationId, topicId } = await params;

  const result = await loadOsceStation(stationId);

  if (!result.ok) {
    if (result.kind === "not_found") {
      notFound();
    }
    return (
      <div>
        <OsceBreadcrumbSetter second="Kurs na OSCE" />
        <h1 className="font-heading text-heading-xl text-primary">Temat</h1>
        <div className="mt-8">
          <PrzedmiotyError message={result.message} />
        </div>
      </div>
    );
  }

  if (!result.topics.some((t) => t.id === topicId)) {
    notFound();
  }

  const sessionData = await loadTopicSessionData(stationId, topicId);

  if (!sessionData.ok) {
    if (sessionData.kind === "not_found") {
      notFound();
    }
    return (
      <div>
        <OsceBreadcrumbSetter second="Kurs na OSCE" />
        <h1 className="font-heading text-heading-xl text-primary">Temat</h1>
        <div className="mt-8">
          <PrzedmiotyError message={sessionData.message} />
        </div>
      </div>
    );
  }

  const { station } = result;
  const topicIndex = result.topics.findIndex((t) => t.id === topicId);
  const nextTopicId =
    topicIndex >= 0 && topicIndex + 1 < result.topics.length
      ? result.topics[topicIndex + 1]!.id
      : null;

  let sessionId: string | null = null;
  if (sessionData.questions.length > 0) {
    const created = await createOsceTopicSession({
      subjectId: stationId,
      topicId,
      totalQuestions: sessionData.questions.length,
    });
    if (!created.ok) {
      return (
        <div>
          <OsceBreadcrumbSetter
            second="Kurs na OSCE"
            third={`${station.short_name} · ${sessionData.topicName}`}
          />
          <h1 className="font-heading text-heading-xl text-primary">{sessionData.topicName}</h1>
          <div className="mt-8">
            <PrzedmiotyError message={created.message} />
          </div>
        </div>
      );
    }
    sessionId = created.sessionId;
  }

  return (
    <div>
      <OsceBreadcrumbSetter
        second="Kurs na OSCE"
        third={`${station.short_name} · ${sessionData.topicName}`}
      />

      <Link
        href={`/osce/${station.id}`}
        className="mb-6 inline-flex items-center gap-2 font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {station.short_name}
      </Link>

      <h1 className="font-heading text-heading-xl text-primary">{sessionData.topicName}</h1>
      <p className="mt-2 font-body text-body-md text-secondary">{station.name}</p>

      <div className="mt-8 space-y-8">
        <OsceExamTasksBox examTasks={station.exam_tasks} />

        {sessionData.questions.length > 0 && sessionId ? (
          <TopicSession
            initialSessionId={sessionId}
            stationId={stationId}
            topicId={topicId}
            topicName={sessionData.topicName}
            stationShortName={station.short_name}
            knowledgeCard={sessionData.knowledgeCard}
            questions={sessionData.questions}
            nextTopicId={nextTopicId}
            stationHref={`/osce/${station.id}`}
            examTasks={station.exam_tasks}
          />
        ) : (
          <div className="rounded-card border border-border bg-card p-6">
            <h2 className="font-heading text-heading-sm text-primary">Sesja pytań</h2>
            <p className="mt-2 font-body text-body-sm text-secondary">
              Brak aktywnych pytań w tym temacie.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
