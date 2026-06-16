import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OsceBreadcrumbSetter } from "@/features/osce/components/OsceBreadcrumbSetter";
import { OsceExamTasksBox } from "@/features/osce/components/OsceExamTasksBox";
import { TopicSession } from "@/features/osce/components/TopicSession";
import { OPG_QUIZ_TOPIC_ID } from "@/features/osce/constants/opgAtlas";
import { createOsceTopicSession } from "@/features/osce/server/createOsceTopicSession";
import { loadOPGAtlas, loadOPGStructures } from "@/features/osce/server/loadOPGData";
import { loadOsceStation } from "@/features/osce/server/loadOsceStation";
import { loadTopicSessionData } from "@/features/osce/server/loadTopicSessionData";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import OPGPageClient from "./OPGPageClient";

type PageProps = {
  params: Promise<{ stationId: string; topicId: string }>;
};

export default async function OsceTopicSessionPage({ params }: PageProps) {
  const t = await getTranslations("osce");
  const { stationId, topicId } = await params;

  const result = await loadOsceStation(stationId);

  if (!result.ok) {
    if (result.kind === "not_found") {
      notFound();
    }
    return (
      <div>
        <OsceBreadcrumbSetter second={t("courseTitle")} />
        <h1 className="font-heading text-heading-xl text-primary">{t("topicTitle")}</h1>
        <div className="mt-8">
          <PrzedmiotyError message={result.message} />
        </div>
      </div>
    );
  }

  if (!result.topics.some((topic) => topic.id === topicId)) {
    notFound();
  }

  const { station } = result;

  if (topicId === OPG_QUIZ_TOPIC_ID) {
    const topicMeta = result.topics.find((topic) => topic.id === topicId);
    const topicName = topicMeta?.name ?? t("opgPanoramaDefault");

    const [atlas, structures] = await Promise.all([
      loadOPGAtlas("opg_standard_01"),
      loadOPGStructures("opg_standard_01"),
    ]);

    return (
      <div>
        <OsceBreadcrumbSetter
          second={t("courseTitle")}
          third={`${station.short_name} · ${topicName}`}
        />

        <Link
          href={`/osce/${station.id}`}
          className="mb-6 inline-flex items-center gap-2 font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {station.short_name}
        </Link>

        <h1 className="font-heading text-heading-xl text-primary">{topicName}</h1>
        <p className="mt-2 font-body text-body-md text-secondary">{station.name}</p>

        <div className="mt-8">
          {atlas && structures.length > 0 ? (
            <OPGPageClient atlas={atlas} structures={structures} />
          ) : (
            <div className="rounded-card border border-border bg-card p-6">
              <p className="font-body text-body-sm text-secondary">
                {t("opgAtlasNotConfigured")}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const sessionData = await loadTopicSessionData(stationId, topicId);

  if (!sessionData.ok) {
    if (sessionData.kind === "not_found") {
      notFound();
    }
    return (
      <div>
        <OsceBreadcrumbSetter second={t("courseTitle")} />
        <h1 className="font-heading text-heading-xl text-primary">{t("topicTitle")}</h1>
        <div className="mt-8">
          <PrzedmiotyError message={sessionData.message} />
        </div>
      </div>
    );
  }

  const topicIndex = result.topics.findIndex((topic) => topic.id === topicId);
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
            second={t("courseTitle")}
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
        second={t("courseTitle")}
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
            <h2 className="font-heading text-heading-sm text-primary">{t("questionSession")}</h2>
            <p className="mt-2 font-body text-body-sm text-secondary">
              {t("noActiveQuestions")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
