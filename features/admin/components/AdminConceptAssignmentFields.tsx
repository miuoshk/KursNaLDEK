"use client";

import type { AdminTopicCatalogConcept } from "@/features/admin/server/loadAdminTopicCatalog";
import { cn } from "@/lib/utils";

type Props = {
  concepts: AdminTopicCatalogConcept[];
  topicId: string;
  value: string[];
  onChange: (conceptIds: string[]) => void;
};

export function AdminConceptAssignmentFields({
  concepts,
  topicId,
  value,
  onChange,
}: Props) {
  const visible = concepts
    .filter((concept) => concept.topicId === topicId)
    .sort((a, b) => {
      if (a.source === "topic-bootstrap") return -1;
      if (b.source === "topic-bootstrap") return 1;
      return a.name.localeCompare(b.name, "pl");
    });
  const selected = new Set(value);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  return (
    <section className="space-y-2 rounded-card border border-border bg-background/40 p-4">
      <div>
        <h3 className="font-body text-body-xs uppercase tracking-widest text-muted">
          Pojęcia
        </h3>
        <p className="mt-1 font-body text-body-xs text-secondary">
          Wybierz reguły wiedzy sprawdzane przez pytanie. Co najmniej jedno
          pojęcie jest wymagane.
        </p>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-btn border border-brand-gold/30 bg-brand-gold/10 px-3 py-2 font-body text-body-sm text-brand-gold">
          Dla wybranego tematu nie ma jeszcze pojęć.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {visible.map((concept) => {
            const checked = selected.has(concept.id);
            return (
              <label
                key={concept.id}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-btn border px-3 py-2 font-body text-body-sm",
                  checked
                    ? "border-brand-sage/50 bg-brand-sage/10 text-primary"
                    : "border-border bg-background text-secondary",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(concept.id)}
                  className="mt-0.5 size-4 accent-brand-sage"
                />
                <span>
                  {concept.name}
                  {concept.source === "topic-bootstrap" ? (
                    <span className="ml-2 text-body-xs text-muted">dział</span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}
