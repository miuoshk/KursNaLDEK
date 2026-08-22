"use client";

import { useTranslations } from "next-intl";
import { REFERENCE_LABEL, hasCemExams } from "@/lib/products";
import { isSourceFilterUiEnabled } from "@/features/session/lib/sourceFilter";
import {
  sourceSliceAccuracy,
  type SourceAccuracyBreakdown,
} from "@/features/session/lib/sourceAccuracy";

type Props = {
  product: string;
  data: SourceAccuracyBreakdown;
};

export function SourceAccuracyCard({ product, data }: Props) {
  const t = useTranslations("sourceAccuracy");
  if (!isSourceFilterUiEnabled(product)) return null;

  const referenceLabel =
    REFERENCE_LABEL[product] ?? t("referenceFallback");
  const refPct = sourceSliceAccuracy(data.reference);
  const ownPct = sourceSliceAccuracy(data.own);
  const showProtected = hasCemExams(product);

  return (
    <section className="rounded-card border border-border bg-card p-5">
      <h2 className="font-body text-body-xs font-medium uppercase tracking-normal text-muted">
        {t("title")}
      </h2>

      <div className="mt-4 space-y-3">
        <AccuracyRow
          label={referenceLabel}
          pct={refPct}
          seen={data.reference.seen}
          correct={data.reference.correct}
        />
        <AccuracyRow
          label={t("own")}
          pct={ownPct}
          seen={data.own.seen}
          correct={data.own.correct}
        />
      </div>

      <p className="mt-4 font-body text-body-xs text-secondary">
        {t("poolUsed", {
          label: referenceLabel,
          seen: data.reference.seen,
          total: data.reference.total,
        })}
        {showProtected
          ? t("poolProtected", { count: data.protectedCount })
          : null}
      </p>

      <p className="mt-3 font-body text-body-xs text-muted">
        {hasCemExams(product) ? t("captionState") : t("captionCampus")}
      </p>
    </section>
  );
}

function AccuracyRow({
  label,
  pct,
  seen,
  correct,
}: {
  label: string;
  pct: number | null;
  seen: number;
  correct: number;
}) {
  const t = useTranslations("sourceAccuracy");
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="min-w-0 truncate font-body text-body-sm text-primary">
        {label}
      </p>
      <p className="shrink-0 font-body text-body-sm tabular-nums text-primary">
        <span className="text-lg text-brand-gold">
          {pct != null ? `${Math.round(pct * 100)}%` : "—"}
        </span>
        <span className="ml-3 text-secondary">
          {t("ofQuestions", { correct, seen })}
        </span>
      </p>
    </div>
  );
}
