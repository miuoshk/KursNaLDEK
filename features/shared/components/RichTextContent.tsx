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
 * Inline markdown for a text segment between inline-math spans.
 * Markdown trims edge whitespace, which would glue text to neighbouring
 * `$...$` math (e.g. `grawitacji $g$ z` → `grawitacjigz`). Render the
 * surrounding whitespace as literal text nodes to preserve the spacing.
 */
function InlineMarkdownSegment({ text }: { text: string }) {
  const leading = text.match(/^\s+/)?.[0] ?? "";
  const trailing = text.match(/\s+$/)?.[0] ?? "";
  const core = text.slice(leading.length, text.length - trailing.length);

  if (!core) {
    return <>{text}</>;
  }

  return (
    <>
      {leading}
      <ReactMarkdown
        remarkPlugins={[...remarkPlugins]}
        rehypePlugins={[...rehypePlugins]}
        components={inlineMarkdownComponents}
      >
        {core}
      </ReactMarkdown>
      {trailing}
    </>
  );
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
    return <InlineMarkdownSegment key={`md-${index}`} text={part} />;
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
