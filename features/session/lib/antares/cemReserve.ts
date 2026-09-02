import { hasCemExams } from "@/lib/products";
import type { SourceFilter } from "@/features/session/types";

export const CEM_RESERVE_BUCKET_MIN = 70;

type ReserveCandidate = {
  source?: string;
  reserveBucket?: number;
  topicId: string;
};

export type CemReserveUnlockInput = {
  product: string | null | undefined;
  hasPublishedCemSession: boolean;
  source: SourceFilter;
  topicMasteryScore: number;
  examDate: Date | null;
  now?: Date;
};

function daysUntilExam(examDate: Date | null, now: Date): number | null {
  if (!examDate) return null;
  const ms = examDate.getTime() - now.getTime();
  return Math.ceil(ms / 86_400_000);
}

/**
 * Czy wolno wpuścić nowe pytania CEM z reserve_bucket >= 70 do sesji.
 *
 * false = trzymaj je na próbę generalną z arkusza.
 * true  = nie filtruj (rezerwa się nie uruchamia albo jest odblokowana).
 *
 * Dwa warunki nadrzędne (brak egzaminów CEM i brak opublikowanego arkusza) są tu,
 * nie w composerze — inaczej studenci KNNP straciliby backfill CEM.
 */
export function isCemReserveUnlocked(input: CemReserveUnlockInput): boolean {
  if (!hasCemExams(input.product)) return true;
  if (!input.hasPublishedCemSession) return true;
  if (input.source === "reference") return true;
  if (input.topicMasteryScore > 0.7) return true;
  const days = daysUntilExam(input.examDate, input.now ?? new Date());
  if (days !== null && days >= 0 && days <= 14) return true;
  return false;
}

export type HoldCemReserveContext = {
  protectCemPool: boolean;
  product: string | null | undefined;
  source: SourceFilter;
  hasPublishedCemSession: boolean;
  topicMastery: Map<string, number>;
  examDate: Date | null;
  now: Date;
};

/**
 * Odfiltrowuje NIEWIDZIANE pytania CEM z reserve_bucket >= 70, gdy rezerwa
 * jest zablokowana. Due/leech nie przechodzą tędy.
 */
export function filterUnseenHoldingCemReserve<T extends ReserveCandidate>(
  unseen: T[],
  ctx: HoldCemReserveContext,
): T[] {
  if (!ctx.protectCemPool) return unseen;
  if (ctx.source === "reference") return unseen;

  return unseen.filter((q) => {
    if (q.source !== "cem") return true;
    if ((q.reserveBucket ?? 0) < CEM_RESERVE_BUCKET_MIN) return true;
    return isCemReserveUnlocked({
      product: ctx.product,
      hasPublishedCemSession: ctx.hasPublishedCemSession,
      source: ctx.source,
      topicMasteryScore: ctx.topicMastery.get(q.topicId) ?? 0,
      examDate: ctx.examDate,
      now: ctx.now,
    });
  });
}
