import type { ComponentPropsWithoutRef, ReactNode } from "react";
import katex from "katex";
import ReactMarkdown from "react-markdown";
import {
  isInlineMathSegment,
  splitInlineMath,
  stripInlineMathDelimiters,
} from "@/features/shared/lib/inlineMath";
import { remarkPlugins, rehypePlugins } from "@/features/shared/lib/markdownPlugins";
import { cn } from "@/lib/utils";

function ScrollableTable({ children, ...props }: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table {...props} className="w-full border-collapse">
        {children}
      </table>
    </div>
  );
}

const inlineMarkdownComponents = {
  p: ({ children }: { children?: ReactNode }) => <>{children}</>,
  table: ScrollableTable,
} as const;

function InlineMathSpan({ math }: { math: string }) {
  try {
    const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <span>{math}</span>;
  }
}

/**
 * Search-highlight path only: split around `$...$` so the highlight transform
 * touches plain text but not LaTeX. The default (non-highlight) path lets
 * remark-math parse `$...$` inline within the full markdown, which keeps
 * spacing and adjacent text (e.g. `($h$ - opis)`) on one line.
 */
function renderHighlightedSegments(
  text: string,
  renderTextSegment: (segment: string) => ReactNode,
): ReactNode {
  return splitInlineMath(text).map((part, index) => {
    if (isInlineMathSegment(part)) {
      return (
        <InlineMathSpan key={`math-${index}`} math={stripInlineMathDelimiters(part)} />
      );
    }
    return <span key={`text-${index}`}>{renderTextSegment(part)}</span>;
  });
}

type RichTextContentProps = {
  text: string;
  className?: string;
  /** Optional plain-text transform (e.g. catalog search highlight) — applied outside `$...$`. */
  renderTextSegment?: (segment: string) => ReactNode;
};

/**
 * Markdown (GFM) + inline LaTeX (`$...$`) for question stems and answer options.
 */
export function RichTextContent({
  text,
  className,
  renderTextSegment,
}: RichTextContentProps) {
  const wrapperClassName = cn(
    "min-w-0 [&_strong]:font-semibold [&_strong]:text-primary",
    className,
  );

  if (renderTextSegment) {
    return (
      <span className={wrapperClassName}>
        {renderHighlightedSegments(text, renderTextSegment)}
      </span>
    );
  }

  return (
    <span className={wrapperClassName}>
      <ReactMarkdown
        remarkPlugins={[...remarkPlugins]}
        rehypePlugins={[...rehypePlugins]}
        components={inlineMarkdownComponents}
      >
        {text}
      </ReactMarkdown>
    </span>
  );
}
