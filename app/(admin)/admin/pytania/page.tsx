import {
  loadAdminQuestions,
  type AdminQuestionActiveFilter,
} from "@/features/admin/server/loadAdminQuestions";
import { AdminQuestionsTable } from "@/features/admin/components/AdminQuestionsTable";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    searchIn?: string;
    subject?: string;
    active?: string;
  }>;
};

function normalizeSearchIn(value: string | undefined): "text" | "explanation" | "both" {
  if (value === "text" || value === "explanation") return value;
  return "both";
}

function normalizeActive(value: string | undefined): AdminQuestionActiveFilter {
  if (value === "active" || value === "inactive") return value;
  return "all";
}

export default async function AdminQuestionsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 20;

  const result = await loadAdminQuestions({
    page,
    perPage,
    search: sp.search,
    searchIn: normalizeSearchIn(sp.searchIn),
    subjectId: sp.subject,
    active: normalizeActive(sp.active),
  });

  return (
    <div>
      <h1 className="font-heading text-heading-lg text-primary sm:text-heading-xl">
        Zarządzanie pytaniami
      </h1>
      <p className="mt-2 font-body text-body-sm text-secondary">
        Przeglądaj, edytuj i wyłączaj pytania. Wyszukiwarka obsługuje też
        słowa kluczowe w wyjaśnieniach (np. „kreatynina", „znieczulenie miejscowe").
      </p>
      <AdminQuestionsTable
        questions={result.questions}
        total={result.total}
        page={page}
        perPage={perPage}
      />
    </div>
  );
}
