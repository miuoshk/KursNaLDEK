import { notFound } from "next/navigation";
import { UfoAcceptanceSessionClient } from "@/features/session/components/UfoAcceptanceSessionClient";

export default function UfoAcceptancePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <UfoAcceptanceSessionClient />;
}
