import { redirect } from "next/navigation";
import { SavedQuestionsList } from "@/features/saved/components/SavedQuestionsList";
import { loadSavedQuestions } from "@/features/saved/server/loadSavedQuestions";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Zapisane pytania · KurzNaLDEK",
};

export default async function ZapisanePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const items = await loadSavedQuestions();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          Zapisane pytania
        </h1>
        <p className="mt-1 font-body text-sm text-secondary">
          Twoja prywatna kolekcja pytań do powtórki. Otwórz w katalogu, aby
          zobaczyć wyjaśnienie, lub odepnij gdy już opanujesz materiał.
        </p>
      </header>

      <SavedQuestionsList items={items} />
    </div>
  );
}
