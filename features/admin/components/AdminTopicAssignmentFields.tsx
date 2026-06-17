"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  AdminTopicCatalog,
  AdminTopicCatalogSubject,
} from "@/features/admin/server/loadAdminTopicCatalog";
import { cn } from "@/lib/utils";

type AdminTopicAssignmentFieldsProps = {
  catalog: AdminTopicCatalog;
  topicId: string;
  themeLabel: string;
  subthemeLabel: string;
  initialSubjectId?: string | null;
  onTopicIdChange: (value: string) => void;
  onThemeLabelChange: (value: string) => void;
  onSubthemeLabelChange: (value: string) => void;
};

function subjectLabel(subject: AdminTopicCatalogSubject): string {
  const track =
    subject.track === "lekarski"
      ? "Lek."
      : subject.track === "stomatologia"
        ? "Stom."
        : subject.track;
  const short = subject.shortName?.trim();
  const name = short && short !== subject.name ? `${subject.name} (${short})` : subject.name;
  return `${track} · R${subject.year} · ${name}`;
}

export function AdminTopicAssignmentFields({
  catalog,
  topicId,
  themeLabel,
  subthemeLabel,
  initialSubjectId,
  onTopicIdChange,
  onThemeLabelChange,
  onSubthemeLabelChange,
}: AdminTopicAssignmentFieldsProps) {
  const topicById = useMemo(() => {
    const map = new Map(catalog.topics.map((topic) => [topic.id, topic]));
    return map;
  }, [catalog.topics]);

  const subjectsWithTopics = useMemo(() => {
    const subjectIdsWithTopics = new Set(catalog.topics.map((topic) => topic.subjectId));
    return catalog.subjects.filter((subject) => subjectIdsWithTopics.has(subject.id));
  }, [catalog.subjects, catalog.topics]);

  const [subjectId, setSubjectId] = useState(() => {
    if (topicId) {
      const topic = topicById.get(topicId);
      if (topic) return topic.subjectId;
    }
    if (initialSubjectId && subjectsWithTopics.some((s) => s.id === initialSubjectId)) {
      return initialSubjectId;
    }
    return subjectsWithTopics[0]?.id ?? "";
  });

  useEffect(() => {
    if (topicId) {
      const topic = topicById.get(topicId);
      if (topic && topic.subjectId !== subjectId) {
        setSubjectId(topic.subjectId);
      }
      return;
    }
    if (
      initialSubjectId &&
      subjectsWithTopics.some((subject) => subject.id === initialSubjectId) &&
      subjectId !== initialSubjectId
    ) {
      setSubjectId(initialSubjectId);
    }
  }, [topicId, initialSubjectId, topicById, subjectsWithTopics, subjectId]);

  const topicsForSubject = useMemo(
    () => catalog.topics.filter((topic) => topic.subjectId === subjectId),
    [catalog.topics, subjectId],
  );

  const selectedTopic = topicId ? topicById.get(topicId) : undefined;
  const selectedSubject = selectedTopic
    ? catalog.subjects.find((subject) => subject.id === selectedTopic.subjectId)
    : undefined;

  const handleSubjectChange = (nextSubjectId: string) => {
    setSubjectId(nextSubjectId);
    const currentTopic = topicId ? topicById.get(topicId) : undefined;
    if (currentTopic?.subjectId === nextSubjectId) return;
    onTopicIdChange("");
  };

  return (
    <section className="rounded-card border border-border bg-background/40 p-3">
      <div className="mb-3">
        <h3 className="font-heading text-heading-sm text-primary">
          Przypisanie tematyczne
        </h3>
        <p className="mt-1 font-body text-body-xs text-muted">
          Temat w katalogu oraz opcjonalne etykiety do statystyk i filtrów.
        </p>
      </div>

      {selectedTopic && selectedSubject ? (
        <p className="mb-3 rounded-btn bg-card px-3 py-2 font-body text-body-xs text-secondary">
          Aktualnie:{" "}
          <span className="text-primary">
            {subjectLabel(selectedSubject)} → {selectedTopic.name}
          </span>{" "}
          <span className="text-muted">({selectedTopic.id})</span>
        </p>
      ) : (
        <p className="mb-3 rounded-btn border border-error/30 bg-error/5 px-3 py-2 font-body text-body-xs text-error">
          Brak przypisanego tematu — wybierz przedmiot i dział poniżej.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Przedmiot">
          <select
            value={subjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className={selectClass}
          >
            {subjectsWithTopics.length === 0 ? (
              <option value="">Brak przedmiotów w katalogu</option>
            ) : (
              subjectsWithTopics.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subjectLabel(subject)}
                </option>
              ))
            )}
          </select>
        </Field>

        <Field label="Dział (topic)">
          <select
            value={topicId}
            onChange={(e) => onTopicIdChange(e.target.value)}
            disabled={!subjectId || topicsForSubject.length === 0}
            className={selectClass}
          >
            {topicsForSubject.length === 0 ? (
              <option value="">Brak działów dla przedmiotu</option>
            ) : (
              <>
                <option value="">— wybierz dział —</option>
                {topicsForSubject.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name} ({topic.id})
                  </option>
                ))}
              </>
            )}
          </select>
        </Field>

        <Field label="Etykieta tematu (theme_label)">
          <input
            type="text"
            value={themeLabel}
            placeholder="np. Ośrodkowy układ nerwowy"
            onChange={(e) => onThemeLabelChange(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Podtemat (subtheme_label)">
          <input
            type="text"
            value={subthemeLabel}
            placeholder="np. Nerw trójdzielny (V)"
            onChange={(e) => onSubthemeLabelChange(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
    </section>
  );
}

const inputClass = cn(
  "w-full rounded-btn border border-border bg-background px-3 py-2",
  "font-body text-body-sm text-primary placeholder:text-muted",
  "focus:border-brand-sage focus:outline-none",
);

const selectClass = cn(inputClass, "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50");

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-body-xs uppercase tracking-widest text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
