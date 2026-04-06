import { createClient } from "@/lib/supabase/server";

export type AdminReport = {
  id: string;
  questionId: string;
  questionTextShort: string;
  category: string;
  description: string;
  status: string;
  userName: string;
  adminResponse: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export async function loadAdminReports(params: {
  status?: string;
}): Promise<AdminReport[]> {
  const supabase = await createClient();

  let query = supabase
    .from("error_reports")
    .select("*, profiles(display_name), questions(text)")
    .order("created_at", { ascending: true });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error("[loadAdminReports]", error.message);
    return [];
  }

  return (rows ?? []).map((r) => {
    const profile = r.profiles as { display_name: string | null } | null;
    const question = r.questions as { text: string } | null;
    const text = question?.text ?? "";
    return {
      id: r.id as string,
      questionId: r.question_id as string,
      questionTextShort: text.length > 80 ? text.slice(0, 80) + "…" : text,
      category: r.category as string,
      description: r.description as string,
      status: r.status as string,
      userName: profile?.display_name ?? "Anonimowy",
      adminResponse: r.admin_response as string | null,
      createdAt: r.created_at as string,
      resolvedAt: r.resolved_at as string | null,
    };
  });
}
