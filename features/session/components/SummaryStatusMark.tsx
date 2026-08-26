import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SummaryAnswerStatus = "correct" | "wrong" | "lucky" | "unanswered";

export function SummaryStatusMark({
  status,
  className,
}: {
  status: SummaryAnswerStatus;
  className?: string;
}) {
  const Icon = status === "wrong" ? X : status === "unanswered" ? null : Check;

  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
        status === "correct" && "bg-success text-brand-bg",
        status === "wrong" && "bg-error text-brand-bg",
        status === "lucky" && "bg-brand-gold text-brand-bg",
        status === "unanswered" && "border border-white/20 bg-transparent",
        className,
      )}
      aria-hidden
    >
      {Icon ? <Icon className="size-3" strokeWidth={3} /> : null}
    </span>
  );
}
