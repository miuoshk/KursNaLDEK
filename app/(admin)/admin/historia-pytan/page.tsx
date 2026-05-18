import {
  loadAdminQuestionEdits,
  loadQuestionEditEditors,
} from "@/features/admin/server/loadAdminQuestionEdits";
import { AdminQuestionEditsTable } from "@/features/admin/components/AdminQuestionEditsTable";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    editor?: string;
    question?: string;
  }>;
};

export default async function AdminQuestionEditsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 20;

  const [result, editors] = await Promise.all([
    loadAdminQuestionEdits({
      page,
      perPage,
      search: sp.q,
      editorId: sp.editor,
      questionId: sp.question,
    }),
    loadQuestionEditEditors(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-[32px] leading-[1.15] text-primary sm:text-[40px]">
        Historia zmian pytań
      </h1>
      <p className="mt-3 font-body text-body-md text-secondary">
        Kto, kiedy i co zmienił w pytaniach. Każdy wpis pokazuje pełen diff
        (wartości przed i po) oraz powiązane zgłoszenie błędu, jeśli edycja
        wynikała z raportu.
      </p>

      <AdminQuestionEditsTable
        entries={result.entries}
        total={result.total}
        page={page}
        perPage={perPage}
        editors={editors}
      />
    </div>
  );
}
