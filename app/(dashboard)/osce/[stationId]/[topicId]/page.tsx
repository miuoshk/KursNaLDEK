import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OsceBreadcrumbSetter } from "@/features/osce/components/OsceBreadcrumbSetter";
import { OsceExamTasksBox } from "@/features/osce/components/OsceExamTasksBox";
import { loadOsceStation } from "@/features/osce/server/loadOsceStation";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ stationId: string; topicId: string }>;
};

function sessionHref(stationId: string, topicId: string, questionCount: number) {
  const count = Math.min(50, Math.max(1, questionCount || 10));
  const q = new URLSearchParams({
    subject: stationId,
    topic: topicId,
    mode: "inteligentna",
    count: String(count),
  });
  return `/sesja/new?${q.toString()}`;
}

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

  const topic = result.topics.find((t) => t.id === topicId);
  if (!topic) {
    notFound();
  }

  const { station } = result;
  const href = sessionHref(station.id, topic.id, topic.question_count);
  const canStart = topic.question_count > 0;

  return (
    <div>
      <OsceBreadcrumbSetter
        second="Kurs na OSCE"
        third={`${station.short_name} · ${topic.name}`}
      />

      <Link
        href={`/osce/${station.id}`}
        className="mb-6 inline-flex items-center gap-2 font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {station.short_name}
      </Link>

      <h1 className="font-heading text-heading-xl text-primary">{topic.name}</h1>
      <p className="mt-2 font-body text-body-md text-secondary">{station.name}</p>

      <div className="mt-8 space-y-8">
        <OsceExamTasksBox examTasks={station.exam_tasks} />

        <div className="rounded-card border border-[color:var(--border-subtle)] bg-brand-card-1 p-6">
          <h2 className="font-heading text-heading-sm text-primary">Sesja pytań</h2>
          <p className="mt-2 font-body text-body-sm text-secondary">
            Rozpocznij inteligentną sesję z pytań przypisanych do tego tematu.
          </p>
          {canStart ? (
            <Link
              href={href}
              className={cn(
                "mt-6 inline-flex items-center justify-center rounded-btn bg-brand-gold px-6 py-3",
                "font-body font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110",
              )}
            >
              Rozpocznij sesję
            </Link>
          ) : (
            <p className="mt-4 font-body text-body-sm text-muted">
              Brak aktywnych pytań w tym temacie.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
