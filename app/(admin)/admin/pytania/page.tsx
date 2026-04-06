import { loadAdminQuestions } from "@/features/admin/server/loadAdminQuestions";
import { AdminQuestionsTable } from "@/features/admin/components/AdminQuestionsTable";

type PageProps = {
  searchParams: Promise<{ page?: string; search?: string; subject?: string }>;
};

export default async function AdminQuestionsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 20;

  const result = await loadAdminQuestions({
    page,
    perPage,
    search: sp.search,
    subjectId: sp.subject,
  });

  return (
    <div>
      <h1 className="font-heading text-heading-xl text-primary">Zarządzanie pytaniami</h1>
      <AdminQuestionsTable
        questions={result.questions}
        total={result.total}
        page={page}
        perPage={perPage}
      />
    </div>
  );
}
