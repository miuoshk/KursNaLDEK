import { notFound } from "next/navigation";
import { StatementSetPreviewClient } from "@/features/session/components/StatementSetPreviewClient";

export default function UfoStatementSetPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <StatementSetPreviewClient />;
}
