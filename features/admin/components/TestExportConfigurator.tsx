"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Download, Loader2 } from "lucide-react";
import { Toggle } from "@/features/shared/components/Toggle";
import { cn } from "@/lib/utils";
import { poolSizeForTopic } from "@/features/admin/lib/testExport/poolCount";
import {
  allocateEqual,
  allocateProportional,
  clampQuotaToPool,
} from "@/features/admin/lib/testExport/selectQuestions";
import {
  MAX_TEST_QUESTIONS,
  type TestExportProduct,
  type TestExportSource,
  type TestExportTrack,
} from "@/features/admin/lib/testExport/types";
import type { TestExportCatalog } from "@/features/admin/server/loadTestExportCatalog";

const INPUT =
  "w-full rounded-btn border border-border bg-background px-3 py-2 font-body text-body-sm text-primary placeholder:text-muted focus:border-brand-sage focus:outline-none";

type TestExportConfiguratorProps = {
  catalog: TestExportCatalog;
};

function defaultProduct(catalog: TestExportCatalog): TestExportProduct {
  if (catalog.subjects.some((s) => s.product === "ldew")) return "ldew";
  return "ldek";
}

function defaultTrack(
  catalog: TestExportCatalog,
  product: TestExportProduct,
): TestExportTrack {
  const tracks = catalog.subjects.filter((s) => s.product === product).map((s) => s.track);
  if (tracks.includes("stomatologia")) return "stomatologia";
  return tracks[0] ?? "stomatologia";
}

export function TestExportConfigurator({ catalog }: TestExportConfiguratorProps) {
  const [title, setTitle] = useState("Test próbny");
  const [subtitle, setSubtitle] = useState("");
  const [product, setProduct] = useState<TestExportProduct>(() => defaultProduct(catalog));
  const [track, setTrack] = useState<TestExportTrack>(() =>
    defaultTrack(catalog, defaultProduct(catalog)),
  );
  const [source, setSource] = useState<TestExportSource>("all");
  const [cemSessionIds, setCemSessionIds] = useState<string[]>([]);
  const [quotas, setQuotas] = useState<Record<string, number>>({});
  const [shuffle, setShuffle] = useState(true);
  const [includeKeyAtEnd, setIncludeKeyAtEnd] = useState(false);
  const [includeKeyFile, setIncludeKeyFile] = useState(true);
  const [includeExplanationsFile, setIncludeExplanationsFile] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subjects = useMemo(
    () => catalog.subjects.filter((s) => s.product === product && s.track === track),
    [catalog.subjects, product, track],
  );
  const subjectIds = useMemo(() => new Set(subjects.map((s) => s.id)), [subjects]);
  const topics = useMemo(
    () => catalog.topics.filter((t) => subjectIds.has(t.subjectId)),
    [catalog.topics, subjectIds],
  );
  const sessions = useMemo(
    () => catalog.sessions.filter((s) => s.product === product),
    [catalog.sessions, product],
  );
  const showSessions = source !== "own" && sessions.length > 0;

  const poolByTopic = useMemo(() => {
    const map = new Map<string, number>();
    for (const topic of topics) {
      map.set(
        topic.id,
        poolSizeForTopic(catalog.counts, topic.id, source, product, cemSessionIds),
      );
    }
    return map;
  }, [topics, catalog.counts, source, product, cemSessionIds]);

  const topicIds = useMemo(() => topics.map((t) => t.id), [topics]);

  useEffect(() => {
    setQuotas((prev) => {
      const next: Record<string, number> = {};
      let used = 0;
      let changed = false;
      for (const id of topicIds) {
        const pool = poolByTopic.get(id) ?? 0;
        const clamped = clampQuotaToPool(prev[id] ?? 0, pool, used);
        next[id] = clamped;
        used += clamped;
        if (clamped !== (prev[id] ?? 0)) changed = true;
      }
      for (const id of Object.keys(prev)) {
        if (!(id in next) && (prev[id] ?? 0) !== 0) changed = true;
      }
      return changed ? next : prev;
    });
  }, [topicIds, poolByTopic]);

  const requested = topicIds.reduce((sum, id) => sum + (quotas[id] ?? 0), 0);
  const selectedTopics = topicIds.filter((id) => (quotas[id] ?? 0) > 0).length;
  const selectedSubjects = subjects.filter((s) =>
    topics.some((t) => t.subjectId === s.id && (quotas[t.id] ?? 0) > 0),
  ).length;
  const canGenerate = requested > 0 && requested <= MAX_TEST_QUESTIONS && !busy;

  function setQuota(topicId: string, raw: number) {
    const pool = poolByTopic.get(topicId) ?? 0;
    const others = topicIds.reduce(
      (sum, id) => (id === topicId ? sum : sum + (quotas[id] ?? 0)),
      0,
    );
    setQuotas((prev) => ({
      ...prev,
      [topicId]: clampQuotaToPool(raw, pool, others),
    }));
  }

  function applyAllocation(kind: "equal" | "proportional" | "clear") {
    const poolMap = poolByTopic;
    if (kind === "clear") {
      setQuotas({});
      return;
    }
    const totalPool = topicIds.reduce((sum, id) => sum + (poolMap.get(id) ?? 0), 0);
    const cap = Math.min(MAX_TEST_QUESTIONS, totalPool);
    const rows =
      kind === "equal"
        ? allocateEqual(topicIds, poolMap, cap)
        : allocateProportional(topicIds, poolMap, cap);
    setQuotas(Object.fromEntries(rows.map((r) => [r.topicId, r.count])));
  }

  function fillSubject(subjectId: string, mode: "all" | "clear") {
    const subjectTopics = topics.filter((t) => t.subjectId === subjectId);
    if (mode === "clear") {
      setQuotas((prev) => {
        const next = { ...prev };
        for (const t of subjectTopics) next[t.id] = 0;
        return next;
      });
      return;
    }
    setQuotas((prev) => {
      const next = { ...prev };
      let used = topicIds.reduce((sum, id) => {
        if (subjectTopics.some((t) => t.id === id)) return sum;
        return sum + (prev[id] ?? 0);
      }, 0);
      for (const t of subjectTopics) {
        const pool = poolByTopic.get(t.id) ?? 0;
        const count = clampQuotaToPool(pool, pool, used);
        next[t.id] = count;
        used += count;
      }
      return next;
    });
  }

  async function onGenerate() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/test-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Test próbny",
          subtitle: subtitle.trim() || undefined,
          product,
          track,
          source,
          cemSessionIds: showSessions ? cemSessionIds : [],
          topics: topicIds
            .filter((id) => (quotas[id] ?? 0) > 0)
            .map((topicId) => ({ topicId, count: quotas[topicId] ?? 0 })),
          shuffle,
          includeKeyAtEnd,
          includeKeyFile,
          includeExplanationsFile,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Nie udało się wygenerować pliku.");
        return;
      }
      const blob = await res.blob();
      const header = res.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(header);
      const filename = match?.[1] ?? "test.docx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Błąd sieci przy generowaniu pliku.");
    } finally {
      setBusy(false);
    }
  }

  const availableTracks = Array.from(
    new Set(
      catalog.subjects.filter((s) => s.product === product).map((s) => s.track),
    ),
  ) as TestExportTrack[];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[14px] border border-border bg-card p-4 sm:p-5">
        <h2 className="font-heading text-lg text-primary">Nagłówek arkusza</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-body text-body-xs text-muted">Tytuł</span>
            <input
              className={INPUT}
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-body text-body-xs text-muted">
              Podtytuł (opcjonalnie)
            </span>
            <input
              className={INPUT}
              value={subtitle}
              maxLength={180}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="np. Kolokwium 1 · grupa A"
            />
          </label>
        </div>
      </section>

      <section className="rounded-[14px] border border-border bg-card p-4 sm:p-5">
        <h2 className="font-heading text-lg text-primary">Zakres</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <fieldset>
            <legend className="mb-1 font-body text-body-xs uppercase tracking-normal text-muted">
              Produkt
            </legend>
            <Segmented
              value={product}
              onChange={(next) => {
                const value = next as TestExportProduct;
                setProduct(value);
                setTrack(defaultTrack(catalog, value));
                setCemSessionIds([]);
                setQuotas({});
              }}
              options={[
                { value: "ldek", label: "LDEK" },
                { value: "ldew", label: "LDEW" },
              ]}
            />
          </fieldset>
          <fieldset>
            <legend className="mb-1 font-body text-body-xs uppercase tracking-normal text-muted">
              Kierunek
            </legend>
            <Segmented
              value={track}
              onChange={(next) => {
                setTrack(next as TestExportTrack);
                setQuotas({});
              }}
              options={availableTracks.map((t) => ({
                value: t,
                label: t === "stomatologia" ? "Stomatologia" : "Lekarski",
              }))}
            />
          </fieldset>
          <fieldset>
            <legend className="mb-1 font-body text-body-xs uppercase tracking-normal text-muted">
              Źródło
            </legend>
            <Segmented
              value={source}
              onChange={(next) => {
                setSource(next as TestExportSource);
                if (next === "own") setCemSessionIds([]);
              }}
              options={[
                { value: "all", label: "Wszystkie" },
                { value: "reference", label: "CEM" },
                { value: "own", label: "Nasze" },
              ]}
            />
          </fieldset>
        </div>

        {showSessions && (
          <div className="mt-4">
            <p className="font-body text-body-xs uppercase tracking-normal text-muted">
              Terminy CEM
            </p>
            <p className="mt-1 font-body text-body-xs text-muted">
              Puste = wszystkie sesje. Filtr dotyczy tylko pytań CEM; własne zostają przy
              źródle „Wszystkie”.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sessions.map((session) => {
                const checked = cemSessionIds.includes(session.id);
                return (
                  <label
                    key={session.id}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-btn border px-2.5 py-1.5 font-body text-body-xs transition-colors",
                      checked
                        ? "border-brand-gold/50 bg-brand-gold/10 text-primary"
                        : "border-border bg-background text-secondary hover:text-primary",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="accent-[color:var(--brand-gold)]"
                      checked={checked}
                      onChange={() => {
                        setCemSessionIds((prev) =>
                          checked
                            ? prev.filter((id) => id !== session.id)
                            : [...prev, session.id],
                        );
                      }}
                    />
                    <span>
                      {session.label}
                      {!session.isPublished ? " (szkic)" : ""}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-[14px] border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg text-primary">Blueprint tematów</h2>
            <p className="mt-1 font-body text-body-xs text-muted">
              Przy temacie wpisz ile pytań wziąć. Pula zmienia się z filtrem źródła i
              sesjami CEM.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <GhostButton onClick={() => applyAllocation("equal")}>Po równo</GhostButton>
            <GhostButton onClick={() => applyAllocation("proportional")}>
              Proporcjonalnie
            </GhostButton>
            <GhostButton onClick={() => applyAllocation("clear")}>Wyczyść</GhostButton>
          </div>
        </div>

        {subjects.length === 0 ? (
          <p className="mt-4 font-body text-body-sm text-secondary">
            Brak przedmiotów dla tej pary produkt / kierunek.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {subjects.map((subject) => {
              const subjectTopics = topics.filter((t) => t.subjectId === subject.id);
              const open = expanded[subject.id] ?? false;
              const subjectSum = subjectTopics.reduce(
                (sum, t) => sum + (quotas[t.id] ?? 0),
                0,
              );
              const subjectPool = subjectTopics.reduce(
                (sum, t) => sum + (poolByTopic.get(t.id) ?? 0),
                0,
              );
              return (
                <div
                  key={subject.id}
                  className="overflow-hidden rounded-btn border border-border bg-background/40"
                >
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [subject.id]: !open }))
                      }
                    >
                      <ChevronDown
                        className={cn(
                          "size-4 shrink-0 text-muted transition-transform",
                          !open && "-rotate-90",
                        )}
                        aria-hidden
                      />
                      <span className="truncate font-body text-body-sm text-primary">
                        {subject.shortName && subject.shortName !== subject.name
                          ? `${subject.name} (${subject.shortName})`
                          : subject.name}
                      </span>
                      <span className="shrink-0 font-body text-body-xs text-muted">
                        {subjectSum}/{subjectPool}
                      </span>
                    </button>
                    <GhostButton onClick={() => fillSubject(subject.id, "all")}>
                      Wszystkie
                    </GhostButton>
                    <GhostButton onClick={() => fillSubject(subject.id, "clear")}>
                      0
                    </GhostButton>
                  </div>
                  {open && (
                    <ul className="border-t border-border">
                      {subjectTopics.map((topic) => {
                        const pool = poolByTopic.get(topic.id) ?? 0;
                        const value = quotas[topic.id] ?? 0;
                        return (
                          <li
                            key={topic.id}
                            className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2 last:border-b-0"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-body text-body-sm text-primary">
                                {topic.name}
                              </p>
                              <p className="font-body text-body-xs text-muted">
                                {topic.id} · pula {pool}
                              </p>
                            </div>
                            <input
                              type="number"
                              min={0}
                              max={pool}
                              className="w-20 rounded-btn border border-border bg-background px-2 py-1.5 font-body text-body-sm text-primary tabular-nums focus:border-brand-sage focus:outline-none"
                              value={value}
                              disabled={pool === 0}
                              onChange={(e) =>
                                setQuota(topic.id, Number(e.target.value) || 0)
                              }
                            />
                            <GhostButton
                              disabled={pool === 0}
                              onClick={() => setQuota(topic.id, pool)}
                            >
                              Wszystkie
                            </GhostButton>
                            <GhostButton
                              disabled={pool === 0}
                              onClick={() =>
                                setQuota(
                                  topic.id,
                                  MAX_TEST_QUESTIONS -
                                    topicIds.reduce(
                                      (sum, id) =>
                                        id === topic.id ? sum : sum + (quotas[id] ?? 0),
                                      0,
                                    ),
                                )
                              }
                            >
                              Dopełnij
                            </GhostButton>
                            <GhostButton onClick={() => setQuota(topic.id, 0)}>
                              0
                            </GhostButton>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-[14px] border border-border bg-card p-4 sm:p-5">
        <h2 className="font-heading text-lg text-primary">Wyjście</h2>
        <div className="mt-4 flex flex-col gap-3">
          <ToggleRow
            id="shuffle"
            checked={shuffle}
            onChange={setShuffle}
            label="Losowa kolejność pytań"
            hint="Wyłączone: kolejność tematów, w temacie po ID. Liter A–E nie tasujemy."
          />
          <ToggleRow
            id="key-end"
            checked={includeKeyAtEnd}
            onChange={setIncludeKeyAtEnd}
            label="Klucz na końcu arkusza"
            hint="Nowa strona w pliku testu, tabela 1. C / 2. A."
          />
          <ToggleRow
            id="key-file"
            checked={includeKeyFile}
            onChange={setIncludeKeyFile}
            label="Osobny plik z kluczem"
          />
          <ToggleRow
            id="expl-file"
            checked={includeExplanationsFile}
            onChange={setIncludeExplanationsFile}
            label="Osobny plik z wyjaśnieniami"
            hint="Dla prowadzącego — z ID pytania drobnym drukiem."
          />
        </div>
      </section>

      <div className="sticky bottom-3 z-10 rounded-[14px] border border-border bg-card/95 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-body-sm text-secondary">
            <span className="tabular-nums text-primary">
              {requested} / {MAX_TEST_QUESTIONS}
            </span>
            {" · "}
            {selectedTopics} {selectedTopics === 1 ? "temat" : "tematów"}
            {" · "}
            {selectedSubjects}{" "}
            {selectedSubjects === 1 ? "przedmiot" : "przedmioty"}
          </p>
          <button
            type="button"
            disabled={!canGenerate}
            onClick={() => void onGenerate()}
            className="inline-flex items-center gap-2 rounded-btn bg-brand-gold px-4 py-2 font-body text-body-sm font-medium text-brand-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            Generuj
          </button>
        </div>
        {error && (
          <p className="mt-2 font-body text-body-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-btn border border-border bg-background p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-btn px-3 py-1.5 font-body text-body-xs transition-colors",
            value === opt.value
              ? "bg-brand-gold/15 text-brand-gold"
              : "text-secondary hover:text-primary",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-btn border border-border px-2 py-1 font-body text-body-xs text-secondary transition-colors hover:bg-white/[0.04] hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ToggleRow({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-body text-body-sm text-primary">{label}</p>
        {hint && <p className="mt-0.5 font-body text-body-xs text-muted">{hint}</p>}
      </div>
      <Toggle
        checked={checked}
        onCheckedChange={onChange}
        aria-labelledby={id}
      />
      <span id={id} className="sr-only">
        {label}
      </span>
    </div>
  );
}
