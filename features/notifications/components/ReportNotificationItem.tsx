"use client";

import { cn } from "@/lib/utils";
import { formatChangedFieldsList } from "@/features/notifications/lib/questionEditFieldLabel";
import {
  reportVerdictDescription,
  reportVerdictLabel,
} from "@/features/notifications/lib/reportVerdictLabel";
import type { ReportNotification } from "@/features/notifications/types";

type Props = {
  item: ReportNotification;
  isUnread: boolean;
  onRead: () => void;
  formatDate: (iso: string) => string;
};

export function ReportNotificationItem({
  item,
  isUnread,
  onRead,
  formatDate,
}: Props) {
  const q = item.question;
  const changedSummary = q ? formatChangedFieldsList(q.changedFields) : "";

  return (
    <button
      type="button"
      onClick={onRead}
      className={cn(
        "w-full px-4 py-3 text-left transition-colors hover:bg-white/[0.04]",
        isUnread && "bg-brand-gold/[0.06]",
      )}
    >
      <p className="font-body text-body-sm font-medium text-primary">
        {reportVerdictLabel(item.status)}
      </p>
      <p className="mt-0.5 font-body text-body-xs text-secondary">
        {reportVerdictDescription(item.status, item.category)}
      </p>

      {q ? (
        <div className="mt-3 space-y-2 rounded-lg border border-white/[0.08] bg-white/[0.03] p-2.5">
          {q.changedFields.length > 0 ? (
            <p className="font-body text-[10px] font-medium uppercase tracking-wide text-brand-gold">
              Pytanie zaktualizowane · {changedSummary}
            </p>
          ) : (
            <p className="font-body text-[10px] font-medium uppercase tracking-wide text-muted">
              Podgląd pytania
            </p>
          )}

          <p className="line-clamp-3 whitespace-pre-wrap font-body text-body-xs text-primary">
            {q.text}
          </p>

          {q.options.length > 0 ? (
            <ul className="space-y-0.5">
              {q.options.map((opt) => {
                const isCorrect = opt.id === q.correctOptionId;
                return (
                  <li
                    key={opt.id}
                    className={cn(
                      "font-body text-[11px] leading-snug",
                      isCorrect ? "font-medium text-success" : "text-secondary",
                    )}
                  >
                    <span className="uppercase text-muted">{opt.id})</span>{" "}
                    <span className="line-clamp-2">{opt.text}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {q.explanation.trim() ? (
            <div>
              <p className="font-body text-[10px] font-medium text-muted">Wyjaśnienie</p>
              <p className="line-clamp-3 whitespace-pre-wrap font-body text-[11px] text-primary/90">
                {q.explanation}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 font-body text-body-xs text-muted">
          Pytanie {item.questionId}
        </p>
      )}

      {item.adminResponse?.trim() ? (
        <div className="mt-2.5">
          <p className="font-body text-[10px] font-medium text-muted">
            Komentarz sprawdzającego
          </p>
          <p className="mt-0.5 whitespace-pre-wrap font-body text-body-xs text-primary">
            {item.adminResponse}
          </p>
        </div>
      ) : null}

      <p className="mt-2 font-body text-[11px] text-muted">
        {formatDate(item.resolvedAt)}
      </p>
    </button>
  );
}
