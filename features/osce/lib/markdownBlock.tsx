import ReactMarkdown from "react-markdown";
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
        "[&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:font-mono [&_code]:text-body-sm",
        "[&_strong]:font-semibold [&_strong]:text-primary",
        "[&_h2]:mt-6 [&_h2]:font-heading [&_h2]:text-heading-sm [&_h2]:text-primary",
        "[&_h3]:mt-4 [&_h3]:font-heading [&_h3]:text-body-lg [&_h3]:text-primary",
      )}
    >
      <ReactMarkdown>{md}</ReactMarkdown>
    </div>
  );
}
