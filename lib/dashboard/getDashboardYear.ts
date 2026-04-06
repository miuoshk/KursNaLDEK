import { createClient } from "@/lib/supabase/server";

/**
 * Rok studiów do layoutu (TopBar, Sidebar). Domyślnie 1 przy braku profilu lub błędzie.
 */
export async function getDashboardYear(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[getDashboardYear] auth.getUser:", authError.message);
      return 1;
    }
    if (!user) {
      return 1;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("current_year")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[getDashboardYear] profiles:", error.message, error.code);
      return 1;
    }

    return typeof data?.current_year === "number" ? data.current_year : 1;
  } catch (e) {
    console.error("[getDashboardYear] unexpected:", e);
    return 1;
  }
}
