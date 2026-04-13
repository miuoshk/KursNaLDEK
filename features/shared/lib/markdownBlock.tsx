import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function markdownBlock(md: string) {
  return (
    <div
      className={cn(
        "font-body text-body-md leading-relaxed text-secondary",
        "[&_a]:text-brand-sage [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-brand-gold",
        "[&_p]:mt-3 [&_p:first-child]:mt-0",
        "[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:font-body [&_code]:text-body-sm",
        "[&_strong]:font-semibold [&_strong]:text-primary",
        "[&_h2]:mt-6 [&_h2]:font-heading [&_h2]:text-heading-sm [&_h2]:text-primary",
        "[&_h3]:mt-4 [&_h3]:font-heading [&_h3]:text-body-lg [&_h3]:text-primary",
        "[&_table]:mt-4 [&_table]:w-full [&_table]:border-collapse",
        "[&_th]:border [&_th]:border-white/[0.12] [&_th]:bg-white/[0.04] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-primary",
        "[&_td]:border [&_td]:border-white/[0.12] [&_td]:px-3 [&_td]:py-2",
        "[&_tr:hover]:bg-white/[0.02]",
        "[&_del]:text-muted [&_del]:line-through",
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
    </div>
  );
}
