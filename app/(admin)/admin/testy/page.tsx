import { loadTestExportCatalog } from "@/features/admin/server/loadTestExportCatalog";
import { TestExportConfigurator } from "@/features/admin/components/TestExportConfigurator";

export default async function AdminTestyPage() {
  const catalog = await loadTestExportCatalog();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
        Testy DOCX
      </h1>
      <p className="mt-1 font-body text-sm text-secondary">
        Złóż arkusz z banku LDEK / LDEW i pobierz sformatowany Word — jak CEM,
        z opcjonalnym kluczem i wyjaśnieniami.
      </p>
      <div className="mt-6">
        <TestExportConfigurator catalog={catalog} />
      </div>
    </div>
  );
}
