import {
  loadAdminReportFacets,
  loadAdminReports,
  type AdminReportSortBy,
  type SortDirection,
} from "@/features/admin/server/loadAdminReports";
import { AdminReportsTable } from "@/features/admin/components/AdminReportsTable";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    track?: string;
    year?: string;
    subject?: string;
    sortBy?: string;
    sortDir?: string;
    view?: string;
  }>;
};

const VALID_SORT: AdminReportSortBy[] = [
  "createdAt",
  "status",
  "category",
  "subject",
  "reportCount",
];

function parseSortBy(value: string | undefined): AdminReportSortBy {
  return VALID_SORT.includes(value as AdminReportSortBy)
    ? (value as AdminReportSortBy)
    : "createdAt";
}

function parseSortDir(value: string | undefined): SortDirection {
  return value === "asc" ? "asc" : "desc";
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const year = sp.year ? Number(sp.year) : undefined;
  const sortBy = parseSortBy(sp.sortBy);
  const sortDir = parseSortDir(sp.sortDir);

  const [reports, facets] = await Promise.all([
    loadAdminReports({
      status: sp.status,
      track: sp.track,
      year: Number.isFinite(year) ? year : undefined,
      subjectId: sp.subject,
      sortBy,
      sortDir,
    }),
    loadAdminReportFacets(),
  ]);

  return (
    <div>
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          Zgłoszenia błędów
        </h1>
        <p className="mt-1 font-body text-sm text-secondary">
          Skrzynka lub grupowanie po pytaniu z historią zgłoszeń. Domyślnie od najnowszych.
        </p>
      </header>
      <AdminReportsTable
        reports={reports}
        facets={facets}
        currentStatus={sp.status}
        currentTrack={sp.track}
        currentYear={Number.isFinite(year) ? year : undefined}
        currentSubject={sp.subject}
        currentSortBy={sortBy}
        currentSortDir={sortDir}
        currentView={sp.view === "grouped" ? "grouped" : "inbox"}
      />
    </div>
  );
}
