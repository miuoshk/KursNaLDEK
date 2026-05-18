import {
  loadAdminQuestions,
  type AdminQuestionActiveFilter,
  type AdminQuestionSortBy,
  type SortDir,
} from "@/features/admin/server/loadAdminQuestions";
import { AdminQuestionsTable } from "@/features/admin/components/AdminQuestionsTable";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    searchIn?: string;
    subject?: string;
    active?: string;
    sortBy?: string;
    sortDir?: string;
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

function normalizeSortBy(value: string | undefined): AdminQuestionSortBy {
  if (
    value === "id" ||
    value === "topic" ||
    value === "isActive" ||
    value === "timesAnswered" ||
    value === "accuracy"
  ) {
    return value;
  }
  return "id";
}

function normalizeSortDir(value: string | undefined): SortDir {
  return value === "desc" ? "desc" : "asc";
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
    sortBy: normalizeSortBy(sp.sortBy),
    sortDir: normalizeSortDir(sp.sortDir),
  });

  return (
    <div>
      <h1 className="font-heading text-[32px] leading-[1.15] text-primary sm:text-[40px]">
        Zarządzanie pytaniami
      </h1>
      <p className="mt-3 font-body text-body-md text-secondary">
        Przeglądaj, edytuj i wyłączaj pytania. Wyszukiwarka obsługuje też
        słowa kluczowe w wyjaśnieniach (np. „kreatynina”, „znieczulenie
        miejscowe”). Tabelę można sortować po dowolnej kolumnie z ikoną
        strzałki.
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
