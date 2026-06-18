import type { ReactNode } from "react";
import { RichTextContent } from "@/features/shared/components/RichTextContent";
import { parseDualColumnListQuestion } from "@/lib/content/parseDualColumnListQuestion";
import { cn } from "@/lib/utils";

type QuestionTextContentProps = {
  text: string;
  className?: string;
  /** Opcjonalne podświetlenie (np. wyszukiwarka katalogu). */
  renderSegment?: (segment: string) => ReactNode;
};

function renderSegment(text: string, render?: (s: string) => ReactNode): ReactNode {
  return (
    <RichTextContent
      text={text}
      renderTextSegment={render}
    />
  );
}

function ListColumn({
  items,
  renderSegment: render,
}: {
  items: Array<{ marker: string; body: string }>;
  renderSegment?: (segment: string) => ReactNode;
}) {
  return (
    <ul className="space-y-2 font-body text-body-sm leading-relaxed text-primary md:text-body-md">
      {items.map((item) => (
        <li key={item.marker} className="flex gap-2">
          <span className="shrink-0 font-medium tabular-nums text-brand-gold">{item.marker}</span>
          <span className="min-w-0">{renderSegment(item.body, render)}</span>
        </li>
      ))}
    </ul>
  );
}

export function QuestionTextContent({
  text,
  className,
  renderSegment: render,
}: QuestionTextContentProps) {
  const parsed = parseDualColumnListQuestion(text);

  if (parsed.kind === "plain") {
    return (
      <p className={cn("whitespace-pre-wrap font-body leading-relaxed text-primary", className)}>
        {renderSegment(parsed.text, render)}
      </p>
    );
  }

  return (
    <div className={cn("font-body leading-relaxed text-primary", className)}>
      {parsed.intro ? (
        <p className="whitespace-pre-wrap text-body-md md:text-body-lg">
          {renderSegment(parsed.intro, render)}
        </p>
      ) : null}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6",
          parsed.intro ? "mt-4" : undefined,
        )}
      >
        <ListColumn items={parsed.left} renderSegment={render} />
        <ListColumn items={parsed.right} renderSegment={render} />
      </div>
      {parsed.footer ? (
        <p className="mt-4 whitespace-pre-wrap text-body-md md:text-body-lg">
          {renderSegment(parsed.footer, render)}
        </p>
      ) : null}
    </div>
  );
}
