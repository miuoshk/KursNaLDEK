import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocumentPage } from "@/features/legal/components/LegalDocumentPage";
import { LEGAL_DOCUMENTS } from "@/features/legal/constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: `${t("legalRegulamin")} — ${t("appName")}`,
  };
}

export default async function RegulaminPage() {
  const t = await getTranslations("common");
  const doc = LEGAL_DOCUMENTS.regulamin;
  return <LegalDocumentPage title={t("legalRegulamin")} pdfPath={doc.pdfPath} />;
}
