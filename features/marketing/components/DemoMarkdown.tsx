import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type DemoMarkdownProps = {
  children: string;
  className?: string;
};

/** Wyjaśnienie w mockupach landingu: GFM bez KaTeX, ciasna typografia pod małe karty. */
export function DemoMarkdown({ children, className }: DemoMarkdownProps) {
  return (
    <div
      className={cn(
        "font-body text-body-xs leading-5 text-secondary",
        "[&_em]:italic [&_strong]:font-semibold [&_strong]:text-primary",
        "[&_p]:mt-1.5 [&_p:first-child]:mt-0",
        "[&_ul]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mt-0.5",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
