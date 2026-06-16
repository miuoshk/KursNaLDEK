import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { OPGAtlas } from "@/features/osce/components/OPGAtlas";
import { OsceBreadcrumbSetter } from "@/features/osce/components/OsceBreadcrumbSetter";
import { loadOpgAtlasData } from "@/features/osce/server/loadOpgAtlasData";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";

export default async function OpgAtlasPage() {
  const t = await getTranslations("osce");
  const result = await loadOpgAtlasData();

  if (!result.ok) {
    return (
      <div>
        <OsceBreadcrumbSetter second={t("courseTitle")} third={t("atlasOpg")} />
        <h1 className="font-heading text-heading-xl text-primary">{t("atlasOpg")}</h1>
        <div className="mt-8">
          <PrzedmiotyError message={result.message} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <OsceBreadcrumbSetter second={t("courseTitle")} third={t("atlasOpg")} />

      <Link
        href="/osce"
        className="mb-6 inline-flex items-center gap-2 font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("courseTitle")}
      </Link>

      <h1 className="font-heading text-heading-xl text-primary">{t("atlasOpg")}</h1>
      <p className="mt-2 max-w-2xl font-body text-body-md text-secondary">
        {t("opgAtlasDescription", { type: "image_identify" })}
      </p>

      <div className="mt-10">
        <OPGAtlas panoramas={result.panoramas} />
      </div>
    </div>
  );
}
