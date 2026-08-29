import { redirect } from "next/navigation";
import { requireRotaOwner } from "@/features/admin/server/adminAuth";
import { loadCemInbox } from "@/features/admin/server/loadCemInbox";
import { CemInboxMapper } from "@/features/admin/components/CemInboxMapper";

type PageProps = {
  searchParams: Promise<{ subject?: string }>;
};

export default async function AdminCemInboxPage({ searchParams }: PageProps) {
  try {
    await requireRotaOwner();
  } catch {
    redirect("/admin");
  }

  const sp = await searchParams;
  const data = await loadCemInbox(sp.subject);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
        Poczekalnia CEM
      </h1>
      <p className="mt-1 font-body text-sm text-secondary">
        Przypisz zaimportowane pytania do tematów. Klawiatura: 1–9, Enter, S, Backspace.
      </p>
      {data.subjectId && data.inboxId ? (
        <div className="mt-6">
          <CemInboxMapper
            subjects={data.subjects}
            subjectId={data.subjectId}
            inboxId={data.inboxId}
            topics={data.topics}
            initialQuestions={data.questions}
          />
        </div>
      ) : (
        <p className="mt-6 font-body text-secondary">Brak przedmiotów LDEW.</p>
      )}
    </div>
  );
}
