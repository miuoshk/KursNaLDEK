import { Fragment, type ReactNode } from "react";

function parseSegments(text: string): ReactNode[] {
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < text.length) {
    const bold = text.indexOf("**", i);
    const tick = text.indexOf("`", i);

    let next = -1;
    let kind: "bold" | "code" | null = null;

    if (bold !== -1 && (tick === -1 || bold <= tick)) {
      next = bold;
      kind = "bold";
    } else if (tick !== -1) {
      next = tick;
      kind = "code";
    }

    if (next === -1 || kind === null) {
      out.push(<Fragment key={key++}>{text.slice(i)}</Fragment>);
      break;
    }

    if (next > i) {
      out.push(<Fragment key={key++}>{text.slice(i, next)}</Fragment>);
    }

    if (kind === "bold") {
      const end = text.indexOf("**", next + 2);
      if (end === -1) {
        out.push(<Fragment key={key++}>{text.slice(next)}</Fragment>);
        break;
      }
      const inner = text.slice(next + 2, end);
      out.push(
        <strong key={key++} className="font-semibold text-primary">
          {inner}
        </strong>,
      );
      i = end + 2;
    } else {
      const end = text.indexOf("`", next + 1);
      if (end === -1) {
        out.push(<Fragment key={key++}>{text.slice(next)}</Fragment>);
        break;
      }
      const inner = text.slice(next + 1, end);
      out.push(
        <code
          key={key++}
          className="rounded px-1 py-0.5 font-body text-[0.9em] text-brand-gold/90 bg-white/[0.06]"
        >
          {inner}
        </code>,
      );
      i = end + 1;
    }
  }

  return out;
}

export function FormattedExplanation({ text }: { text: string }) {
  return (
    <div className="font-body text-body-md leading-relaxed text-secondary">
      {parseSegments(text)}
    </div>
  );
}
