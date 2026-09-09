"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ExplanationBlocksStatementSet } from "@/features/shared/lib/explanationBlocks";
import { contrastToMarkdown } from "@/features/shared/lib/explanationBlocks";
import { markdownBlock } from "@/features/shared/lib/markdownBlock";
import {
  computeStatementSetDiff,
  formatStatementNumbers,
  statementDisplayNumber,
  trueStatementIds,
} from "@/features/shared/lib/statementSet";
import { prefersSessionReducedMotion } from "@/features/session/lib/sessionBottomBar";
import { cn } from "@/lib/utils";

const UFO_PROSE =
  "text-[16px] leading-[1.6] text-primary md:text-[17px] [&_p]:my-0 [&_p]:text-[16px] [&_p]:leading-[1.6] [&_p]:text-primary md:[&_p]:text-[17px] [&_p+_p]:mt-2";

function statementAnchorId(statementId: string): string {
  return `ufo-statement-${statementId}`;
}

function scrollToStatement(statementId: string) {
  const node = document.getElementById(statementAnchorId(statementId));
  if (!node) return;
  node.scrollIntoView({
    block: "start",
    behavior: prefersSessionReducedMotion() ? "auto" : "smooth",
  });
  if (node instanceof HTMLElement) {
    node.focus({ preventScroll: true });
  }
}

function SectionLabel({
  children,
  tone = "secondary",
}: {
  children: React.ReactNode;
  tone?: "secondary" | "gold";
}) {
  return (
    <p
      className={cn(
        "font-body text-[13px] font-semibold md:text-[14px]",
        tone === "gold" ? "text-brand-gold" : "text-secondary",
      )}
    >
      {children}
    </p>
  );
}

function StatementLink({
  number,
  text,
  statementId,
}: {
  number: number;
  text: string;
  statementId: string;
}) {
  return (
    <button
      type="button"
      onClick={() => scrollToStatement(statementId)}
      className="inline-flex min-h-11 max-w-full items-start gap-2 rounded-btn text-left font-body text-[16px] leading-[1.6] text-primary hover:text-brand-gold md:text-[17px]"
    >
      <span className="font-semibold tabular-nums">{number}.</span>
      <span className="min-w-0">{text}</span>
    </button>
  );
}

export function StatementSetFeedback({
  blocks,
  selectedOptionId,
  isCorrect,
}: {
  blocks: ExplanationBlocksStatementSet;
  selectedOptionId: string | null;
  isCorrect: boolean;
}) {
  const t = useTranslations("session");
  const statements = blocks.statements;
  const trueIds = trueStatementIds(statements);
  const selectedIds = selectedOptionId
    ? (blocks.optionStatements[selectedOptionId] ?? [])
    : trueIds;
  const diff = computeStatementSetDiff(selectedIds, trueIds);
  const showDiff = !isCorrect && (diff.add.length > 0 || diff.remove.length > 0);
  const takeaway = blocks.takeaway?.trim() ?? "";
  const trap = blocks.trap?.trim() ?? "";
  const contrast = blocks.contrast;
  const selectedLabel = formatStatementNumbers(statements, selectedIds);
  const correctLabel = formatStatementNumbers(statements, trueIds);

  return (
    <div className="mt-4 divide-y divide-border overflow-hidden rounded-card bg-card">
      <section className="px-4 py-3 sm:px-5" data-feedback-section="statement-sets">
        <p className="font-body text-[16px] leading-[1.6] text-primary md:text-[17px]">
          {t("feedbackSetSummary", {
            selected: selectedLabel || "—",
            correct: correctLabel || "—",
          })}
        </p>
      </section>

      {takeaway ? (
        <section className="px-4 py-3 sm:px-5" data-feedback-section="takeaway-header">
          <SectionLabel tone="gold">{t("feedbackPrinciple")}</SectionLabel>
          <div className="mt-2">{markdownBlock(takeaway, UFO_PROSE)}</div>
        </section>
      ) : null}

      {showDiff ? (
        <section className="px-4 py-3 sm:px-5" data-feedback-section="set-diff">
          <SectionLabel>{t("feedbackSetDiff")}</SectionLabel>
          {diff.remove.length > 0 ? (
            <div className="mt-3">
              <p className="font-body text-[13px] font-semibold text-error">
                {t("feedbackRemoveFromSet")}
              </p>
              <ul className="mt-1 space-y-1">
                {diff.remove.map((id) => {
                  const statement = statements.find((item) => item.id === id);
                  const number = statementDisplayNumber(statements, id);
                  if (!statement || number == null) return null;
                  return (
                    <li key={id}>
                      <StatementLink
                        number={number}
                        text={statement.text}
                        statementId={id}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          {diff.add.length > 0 ? (
            <div className="mt-3">
              <p className="font-body text-[13px] font-semibold text-success">
                {t("feedbackAddToSet")}
              </p>
              <ul className="mt-1 space-y-1">
                {diff.add.map((id) => {
                  const statement = statements.find((item) => item.id === id);
                  const number = statementDisplayNumber(statements, id);
                  if (!statement || number == null) return null;
                  return (
                    <li key={id}>
                      <StatementLink
                        number={number}
                        text={statement.text}
                        statementId={id}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="px-4 py-3 sm:px-5" data-feedback-section="statements">
        <SectionLabel>{t("feedbackStatements")}</SectionLabel>
        <ol className="mt-3 space-y-4">
          {statements.map((statement, index) => {
            const number = statement.number ?? index + 1;
            const markAdd = showDiff && diff.add.includes(statement.id);
            const markRemove = showDiff && diff.remove.includes(statement.id);
            return (
              <li
                key={statement.id}
                id={statementAnchorId(statement.id)}
                tabIndex={-1}
                data-ufo-statement={statement.id}
                className="scroll-mt-24 outline-none"
              >
                <div className="flex items-start gap-2">
                  {statement.isTrue ? (
                    <Check className="mt-1 size-4 shrink-0 text-success" aria-hidden />
                  ) : (
                    <X className="mt-1 size-4 shrink-0 text-error" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[16px] leading-[1.6] text-primary md:text-[17px]">
                      <span className="font-semibold tabular-nums">{number}.</span>{" "}
                      {statement.text}{" "}
                      <span
                        className={cn(
                          "font-semibold",
                          statement.isTrue ? "text-success" : "text-error",
                        )}
                      >
                        {statement.isTrue ? t("feedbackTrue") : t("feedbackFalse")}
                      </span>
                    </p>
                    {markAdd || markRemove ? (
                      <p
                        className={cn(
                          "mt-1 font-body text-body-sm font-semibold",
                          markAdd ? "text-success" : "text-error",
                        )}
                      >
                        {markAdd ? t("feedbackAddMark") : t("feedbackRemoveMark")}
                      </p>
                    ) : null}
                    <div className="mt-1">
                      {markdownBlock(statement.rationale, UFO_PROSE)}
                    </div>
                    {!statement.isTrue && statement.correction ? (
                      <div className="mt-1">
                        {markdownBlock(statement.correction, UFO_PROSE)}
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {contrast && contrast.length > 0 ? (
        <section className="px-4 py-3 sm:px-5" data-feedback-section="contrast">
          <SectionLabel>{t("feedbackContrast")}</SectionLabel>
          <div className="mt-2">
            {markdownBlock(contrastToMarkdown(contrast), UFO_PROSE)}
          </div>
        </section>
      ) : null}

      {trap ? (
        <section className="px-4 py-3 sm:px-5" data-feedback-section="trap">
          <div className="border-l-2 border-brand-gold py-0 pl-3">
            <SectionLabel>{t("feedbackConfusion")}</SectionLabel>
            <div className="mt-2">{markdownBlock(trap, UFO_PROSE)}</div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
