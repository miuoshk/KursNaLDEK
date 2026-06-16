import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SavedQuestionsList } from "@/features/saved/components/SavedQuestionsList";
import { loadSavedQuestions } from "@/features/saved/server/loadSavedQuestions";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  const t = await getTranslations("saved");
  return {
    title: `${t("title")} · KurzNaLDEK`,
  };
}

export default async function ZapisanePage() {
  const t = await getTranslations("saved");
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
          {t("title")}
        </h1>
        <p className="mt-1 font-body text-sm text-secondary">
          {t("description")}
        </p>
      </header>

      <SavedQuestionsList items={items} />
    </div>
  );
}
