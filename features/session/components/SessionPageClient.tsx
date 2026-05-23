"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSessionQuestions } from "@/features/session/api/loadSessionQuestions";
import { startSession } from "@/features/session/api/startSession";
import { CatalogView } from "@/features/session/components/CatalogView";
import { SessionLoadingScreen } from "@/features/session/components/SessionLoadingScreen";
import { SessionStudyView } from "@/features/session/components/SessionStudyView";
import { sessionSummaryStorageKey } from "@/features/session/lib/sessionSummaryStorage";
import {
  peekRetryWrongIds,
  removeRetryWrongIds,
} from "@/features/session/lib/retryWrongStorage";
import {
  clampSessionCount,
  DEFAULT_SESSION_COUNT,
} from "@/features/session/lib/sessionCount";
import type { KnnpSessionMode, SessionQuestion } from "@/features/session/types";

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
      questions: SessionQuestion[];
      reserveQuestions: SessionQuestion[];
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

export function SessionPageClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [boot, setBoot] = useState<Bootstrap>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (sessionId !== "new") {
        try {
          if (sessionStorage.getItem(`session_${sessionId}_completed`)) {
            router.replace(`/sesja/${sessionId}/podsumowanie`);
            return;
          }
        } catch { /* SSR guard */ }
      }

      if (sessionId === "new") {
        const subj = searchParams.get("subject")?.trim() ?? "";
        const mode = parseMode(searchParams.get("mode"));
        const count = parseCount(searchParams.get("count"));
        const topic = searchParams.get("topic") ?? undefined;

        const retryKey = searchParams.get("retry") ?? undefined;
        const retryIds = retryKey ? peekRetryWrongIds(retryKey) : undefined;

        const res = await startSession({
          subjectId: subj || undefined,
          mode,
          count: retryIds ? retryIds.length : count,
          topicId: topic,
          questionIds: retryIds ?? undefined,
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
            questions: res.questions,
            reserveQuestions: [],
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
            questions: res.questions,
            reserveQuestions: res.reserveQuestions ?? [],
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
            questions: SessionQuestion[];
            reserveQuestions?: SessionQuestion[];
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
              questions: parsed.questions,
              reserveQuestions: parsed.reserveQuestions ?? [],
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
        dbMode === "nauka" ? "inteligentna" :
        dbMode === "egzamin" ? "przeglad" :
        (dbMode as KnnpSessionMode);

      setBoot({
        status: "ready",
        sessionId: loaded.sessionId,
        subjectId: loaded.subject.id,
        subjectName: loaded.subject.name,
        subjectShortName: loaded.subject.short_name,
        mode: mappedMode,
        questions: loaded.questions,
        reserveQuestions: loaded.reserveQuestions ?? [],
      });
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router, searchParams]);

  if (boot.status === "loading") {
    return <SessionLoadingScreen />;
  }

  if (boot.status === "error") {
    return (
      <div
        className="mx-auto max-w-md rounded-card border border-error/30 bg-card p-6 text-center"
        role="alert"
      >
        <p className="font-heading text-heading-sm text-primary">Nie udało się uruchomić sesji</p>
        <p className="mt-2 font-body text-body-sm text-secondary">{boot.message}</p>
      </div>
    );
  }

  if (boot.mode === "katalog") {
    const initialQuestionId = searchParams.get("q") ?? undefined;
    return (
      <CatalogView
        subjectName={boot.subjectName}
        questions={boot.questions}
        initialQuestionId={initialQuestionId}
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
      questions={boot.questions}
      reserveQuestions={boot.reserveQuestions}
    />
  );
}
