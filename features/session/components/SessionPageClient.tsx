"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { loadSessionQuestions } from "@/features/session/api/loadSessionQuestions";
import { startSession } from "@/features/session/api/startSession";
import { CatalogView } from "@/features/session/components/CatalogView";
import { SessionLoadingScreen } from "@/features/session/components/SessionLoadingScreen";
import { SessionStudyView } from "@/features/session/components/SessionStudyView";
import {
  peekRetryWrongIds,
  removeRetryWrongIds,
} from "@/features/session/lib/retryWrongStorage";
import {
  clampSessionCount,
  DEFAULT_SESSION_COUNT,
} from "@/features/session/lib/sessionCount";
import { inferSessionTopicId } from "@/features/session/lib/inferSessionTopicId";
import type {
  KnnpSessionMode,
  SessionQuestion,
  SourceFilter,
} from "@/features/session/types";
import { parseSourceFilter } from "@/features/session/lib/sourceFilter";

const CACHE_PREFIX = "kurs-session-";

type Bootstrap =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      sessionId: string;
      subjectId: string;
      subjectName: string;
      subjectShortName: string;
      mode: KnnpSessionMode;
      topicId?: string;
      questions: SessionQuestion[];
      reserveQuestions: SessionQuestion[];
      /** Deep-link do katalogu (param `q`) — trzymany w stanie, nie tylko w URL. */
      initialQuestionId?: string;
      product?: string | null;
      adaptiveFeedbackEnabled: boolean;
      planSnapshot?: unknown;
    };

function parseMode(v: string | null): KnnpSessionMode {
  if (v === "przeglad" || v === "katalog") return v;
  return "inteligentna";
}

function parseCount(v: string | null): number {
  const n = Number(v);
  if (Number.isFinite(n) && n >= 1) return clampSessionCount(n);
  return DEFAULT_SESSION_COUNT;
}

function parseSourceParam(v: string | null): SourceFilter | undefined {
  return parseSourceFilter(v) ?? undefined;
}

export function SessionPageClient({ sessionId }: { sessionId: string }) {
  const t = useTranslations("session");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [boot, setBoot] = useState<Bootstrap>({ status: "loading" });
  const searchKey = searchParams.toString();

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(searchKey);

    async function run() {
      if (sessionId !== "new") {
        try {
          if (sessionStorage.getItem(`session_${sessionId}_completed`)) {
            router.replace(`/sesja/${sessionId}/podsumowanie`);
            return;
          }
        } catch {
          /* SSR guard */
        }
      }

      if (sessionId === "new") {
        const subj = params.get("subject")?.trim() ?? "";
        const mode = parseMode(params.get("mode"));
        const count = parseCount(params.get("count"));
        const topic = params.get("topic") ?? undefined;

        const retryKey = params.get("retry") ?? undefined;
        const retryIds = retryKey ? peekRetryWrongIds(retryKey) : undefined;

        const focusQuestionId = params.get("q")?.trim() || undefined;

        const sessionFocus =
          params.get("focus") === "due" ? ("due" as const) : undefined;

        const res = await startSession({
          subjectId: subj || undefined,
          mode,
          count: retryIds ? retryIds.length : count,
          topicId: topic,
          questionIds: retryIds ?? undefined,
          focusQuestionId: mode === "katalog" ? focusQuestionId : undefined,
          focus: sessionFocus,
          source: parseSourceParam(params.get("src")),
          fillOwn: params.get("fillown") === "1" ? true : undefined,
          dailyPlan: params.get("plan") === "1" ? true : undefined,
        });
        if (cancelled) return;
        if (!res.ok) {
          setBoot({ status: "error", message: res.message });
          return;
        }

        if (retryKey) removeRetryWrongIds(retryKey);

        if (mode === "katalog") {
          setBoot({
            status: "ready",
            sessionId: res.sessionId,
            subjectId: res.subject.id,
            subjectName: res.subject.name,
            subjectShortName: res.subject.short_name,
            mode,
            topicId: topic,
            questions: res.questions,
            reserveQuestions: [],
            initialQuestionId: focusQuestionId,
            product: res.product,
            adaptiveFeedbackEnabled: res.adaptiveFeedbackEnabled,
            planSnapshot: res.planSnapshot,
          });
          return;
        }

        sessionStorage.setItem(
          `${CACHE_PREFIX}${res.sessionId}`,
          JSON.stringify({
            subjectId: res.subject.id,
            subjectName: res.subject.name,
            subjectShortName: res.subject.short_name,
            mode,
            topicId: topic,
            questions: res.questions,
            reserveQuestions: res.reserveQuestions ?? [],
            product: res.product,
            adaptiveFeedbackEnabled: res.adaptiveFeedbackEnabled,
            planSnapshot: res.planSnapshot,
          }),
        );
        router.replace(`/sesja/${res.sessionId}`);
        return;
      }

      const cacheKey = `${CACHE_PREFIX}${sessionId}`;
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as {
            subjectId: string;
            subjectName: string;
            subjectShortName?: string;
            mode: KnnpSessionMode;
            topicId?: string;
            questions: SessionQuestion[];
            reserveQuestions?: SessionQuestion[];
            product?: string | null;
            adaptiveFeedbackEnabled?: boolean;
            planSnapshot?: unknown;
          };
          sessionStorage.removeItem(cacheKey);
          if (!cancelled) {
            setBoot({
              status: "ready",
              sessionId,
              subjectId: parsed.subjectId,
              subjectName: parsed.subjectName,
              subjectShortName: parsed.subjectShortName ?? parsed.subjectName,
              mode: parsed.mode,
              topicId:
                parsed.topicId ??
                inferSessionTopicId(
                  parsed.questions.map((q) => q.topicId ?? "").filter(Boolean),
                ),
              questions: parsed.questions,
              reserveQuestions: parsed.reserveQuestions ?? [],
              product: parsed.product,
              adaptiveFeedbackEnabled: parsed.adaptiveFeedbackEnabled ?? false,
              planSnapshot: parsed.planSnapshot,
            });
          }
          return;
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }

      const loaded = await loadSessionQuestions(sessionId);
      if (cancelled) return;
      if (!loaded.ok) {
        setBoot({ status: "error", message: loaded.message });
        return;
      }

      const dbMode = loaded.mode as string;
      const mappedMode: KnnpSessionMode =
        dbMode === "nauka"
          ? "inteligentna"
          : dbMode === "egzamin"
            ? "przeglad"
            : (dbMode as KnnpSessionMode);

      setBoot({
        status: "ready",
        sessionId: loaded.sessionId,
        subjectId: loaded.subject.id,
        subjectName: loaded.subject.name,
        subjectShortName: loaded.subject.short_name,
        mode: mappedMode,
        topicId: inferSessionTopicId(
          loaded.questions.map((q) => q.topicId ?? "").filter(Boolean),
        ),
        questions: loaded.questions,
        reserveQuestions: loaded.reserveQuestions ?? [],
        product: loaded.product,
        adaptiveFeedbackEnabled: loaded.adaptiveFeedbackEnabled,
        planSnapshot: loaded.planSnapshot,
      });
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router, searchKey]);

  if (boot.status === "loading") {
    return <SessionLoadingScreen />;
  }

  if (boot.status === "error") {
    return (
      <div
        className="mx-auto max-w-md rounded-card border border-error/30 bg-card p-6 text-center"
        role="alert"
      >
        <p className="font-heading text-heading-sm text-primary">
          {t("startFailedTitle")}
        </p>
        <p className="mt-2 font-body text-body-sm text-secondary">
          {boot.message}
        </p>
      </div>
    );
  }

  if (boot.mode === "katalog") {
    return (
      <CatalogView
        key={`${boot.subjectId}-${boot.initialQuestionId ?? "catalog"}`}
        sessionId={boot.sessionId}
        subjectId={boot.subjectId}
        subjectName={boot.subjectName}
        questions={boot.questions}
        initialQuestionId={boot.initialQuestionId}
        product={boot.product}
        initialSource={parseSourceParam(searchParams.get("src"))}
      />
    );
  }

  return (
    <SessionStudyView
      sessionId={boot.sessionId}
      subjectId={boot.subjectId}
      subjectName={boot.subjectName}
      subjectShortName={boot.subjectShortName}
      mode={boot.mode}
      topicId={boot.topicId}
      questions={boot.questions}
      reserveQuestions={boot.reserveQuestions}
      product={boot.product}
      adaptiveFeedbackEnabled={boot.adaptiveFeedbackEnabled}
      planSnapshot={boot.planSnapshot}
    />
  );
}
