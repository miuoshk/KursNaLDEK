import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OPGAtlas } from "@/features/osce/components/OPGAtlas";
import { OsceBreadcrumbSetter } from "@/features/osce/components/OsceBreadcrumbSetter";
import { loadOpgAtlasData } from "@/features/osce/server/loadOpgAtlasData";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";

export default async function OpgAtlasPage() {
  const result = await loadOpgAtlasData();

  if (!result.ok) {
    return (
      <div>
        <OsceBreadcrumbSetter second="Kurs na OSCE" third="Atlas OPG" />
        <h1 className="font-heading text-heading-xl text-primary">Atlas OPG</h1>
        <div className="mt-8">
          <PrzedmiotyError message={result.message} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <OsceBreadcrumbSetter second="Kurs na OSCE" third="Atlas OPG" />

      <Link
        href="/osce"
        className="mb-6 inline-flex items-center gap-2 font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Kurs na OSCE
      </Link>

      <h1 className="font-heading text-heading-xl text-primary">Atlas OPG</h1>
      <p className="mt-2 max-w-2xl font-body text-body-md text-secondary">
        Interaktywne panoramy z oznaczeniami anatomicznymi. Dane pochodzą z bazy pytań (typ{" "}
        <span className="font-body text-body-sm text-muted">image_identify</span>) dla tematu morfologii
        struktur na zdjęciu pantomograficznym.
      </p>

      <div className="mt-10">
        <OPGAtlas panoramas={result.panoramas} />
      </div>
    </div>
  );
}
