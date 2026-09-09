import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { Check, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { remarkPlugins, rehypePlugins } from "@/features/shared/lib/markdownPlugins";
import {
  markdownHasStatementVerdicts,
  parseStatementVerdictLead,
} from "@/features/shared/lib/statementVerdict";
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

function collectText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return collectText(node.props.children);
  }
  return "";
}

function StatementParagraph({
  children,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  const childArray = Children.toArray(children);
  const first = childArray[0];
  if (isValidElement<{ children?: ReactNode }>(first) && first.type === "strong") {
    const parsed = parseStatementVerdictLead(collectText(first.props.children));
    if (parsed) {
      return (
        <p {...props} className="flex items-start gap-2">
          {parsed.ok ? (
            <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          ) : (
            <X className="mt-0.5 size-4 shrink-0 text-error" aria-hidden />
          )}
          <span>
            <strong>
              {parsed.n}) {parsed.statement} —{" "}
              <span className={parsed.ok ? "text-success" : "text-error"}>
                {parsed.verdict}.
              </span>
            </strong>
            {childArray.slice(1)}
          </span>
        </p>
      );
    }
  }
  return <p {...props}>{children}</p>;
}

const mdComponents = {
  table: ScrollableTable,
  p: StatementParagraph,
} as const;

export function markdownBlock(md: string, className?: string) {
  const statementSpacing = markdownHasStatementVerdicts(md);
  return (
    <div
      className={cn(
        "whitespace-normal font-body text-body-md leading-relaxed text-secondary",
        "[&_p]:whitespace-pre-wrap",
        "[&_a]:text-brand-sage [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-brand-gold",
        statementSpacing ? "[&_p+p]:mt-3" : "[&_p+p]:mt-2",
        "[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:whitespace-normal",
        "[&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:whitespace-normal",
        "[&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:font-body [&_code]:text-body-sm",
        "[&_strong]:font-semibold [&_strong]:text-primary",
        "[&_h2]:mt-6 [&_h2]:font-heading [&_h2]:text-heading-sm [&_h2]:text-primary",
        "[&_h3]:mt-4 [&_h3]:font-heading [&_h3]:text-body-lg [&_h3]:text-primary",
        "[&_th]:border [&_th]:border-white/[0.12] [&_th]:bg-white/[0.04] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-primary",
        "[&_td]:border [&_td]:border-white/[0.12] [&_td]:px-3 [&_td]:py-2",
        "[&_tr:hover]:bg-white/[0.02]",
        "[&_del]:text-muted [&_del]:line-through",
        "[&_blockquote]:mt-3 [&_blockquote]:border-l-2 [&_blockquote]:border-brand-gold [&_blockquote]:bg-white/[0.04] [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:not-italic [&_blockquote]:text-secondary",
        "[&_blockquote_p]:mt-0",
        "[&_.katex-display]:my-3",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[...remarkPlugins]}
        rehypePlugins={[...rehypePlugins]}
        components={mdComponents}
      >
        {md}
      </ReactMarkdown>
    </div>
  );
}
