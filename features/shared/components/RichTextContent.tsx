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

type RichTextContentProps = {
  text: string;
  className?: string;
  /** Optional plain-text transform (e.g. catalog search highlight) — applied outside `$...$`. */
  renderTextSegment?: (segment: string) => ReactNode;
};

function renderMathAwareSegments(
  text: string,
  renderTextSegment?: (segment: string) => ReactNode,
): ReactNode {
  const parts = splitInlineMath(text);
  return parts.map((part, index) => {
    if (isInlineMathSegment(part)) {
      return (
        <InlineMathSpan
          key={`math-${index}`}
          math={stripInlineMathDelimiters(part)}
        />
      );
    }
    if (renderTextSegment) {
      return <span key={`text-${index}`}>{renderTextSegment(part)}</span>;
    }
    return (
      <ReactMarkdown
        key={`md-${index}`}
        remarkPlugins={[...remarkPlugins]}
        rehypePlugins={[...rehypePlugins]}
        components={inlineMarkdownComponents}
      >
        {part}
      </ReactMarkdown>
    );
  });
}

/**
 * Markdown (GFM) + inline LaTeX (`$...$`) for question stems and answer options.
 */
export function RichTextContent({
  text,
  className,
  renderTextSegment,
}: RichTextContentProps) {
  const hasMath = text.includes("$");
  const needsSegmentSplit = Boolean(renderTextSegment) || hasMath;

  if (needsSegmentSplit) {
    return (
      <span
        className={cn(
          "min-w-0 [&_strong]:font-semibold [&_strong]:text-primary",
          className,
        )}
      >
        {renderMathAwareSegments(text, renderTextSegment)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "min-w-0 [&_strong]:font-semibold [&_strong]:text-primary",
        className,
      )}
    >
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
