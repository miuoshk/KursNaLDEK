"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSessionQuestions } from "@/features/session/api/loadSessionQuestions";
import { startSession } from "@/features/session/api/startSession";
import { CatalogView } from "@/features/session/components/CatalogView";
import { SessionStudyView } from "@/features/session/components/SessionStudyView";
import {
  peekRetryWrongIds,
  removeRetryWrongIds,
} from "@/features/session/lib/retryWrongStorage";
import type { SessionMode, SessionQuestion } from "@/features/session/types";

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
      mode: SessionMode;
      questions: SessionQuestion[];
    };

function parseMode(v: string | null): SessionMode {
  if (v === "przeglad" || v === "katalog") return v;
  return "inteligentna";
}

function parseCount(v: string | null): number {
  const n = Number(v);
  if (Number.isFinite(n) && n >= 1 && n <= 500) return Math.floor(n);
  return 10;
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
            mode: SessionMode;
            questions: SessionQuestion[];
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
      const mappedMode: SessionMode =
        dbMode === "nauka" ? "inteligentna" :
        dbMode === "egzamin" ? "przeglad" :
        (dbMode as SessionMode);

      setBoot({
        status: "ready",
        sessionId: loaded.sessionId,
        subjectId: loaded.subject.id,
        subjectName: loaded.subject.name,
        subjectShortName: loaded.subject.short_name,
        mode: mappedMode,
        questions: loaded.questions,
      });
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router, searchParams]);

  if (boot.status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-body text-body-md text-secondary">
        Ładowanie sesji…
      </div>
    );
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
    return (
      <CatalogView
        subjectName={boot.subjectName}
        questions={boot.questions}
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
    />
  );
}
