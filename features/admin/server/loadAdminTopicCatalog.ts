import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatAdminTopicName } from "@/features/admin/lib/formatAdminTopicName";

export type AdminTopicCatalogSubject = {
  id: string;
  name: string;
  shortName: string | null;
  track: string;
  year: number;
};

export type AdminTopicCatalogTopic = {
  id: string;
  name: string;
  subjectId: string;
  displayOrder: number;
};

export type AdminTopicCatalog = {
  subjects: AdminTopicCatalogSubject[];
  topics: AdminTopicCatalogTopic[];
};

export const loadAdminTopicCatalog = cache(async (): Promise<AdminTopicCatalog> => {
  const admin = createAdminClient();

  const [subjectsRes, topicsRes] = await Promise.all([
    admin
      .from("subjects")
      .select("id, name, short_name, track, year")
      .order("track", { ascending: true })
      .order("year", { ascending: true })
      .order("name", { ascending: true }),
    admin
      .from("topics")
      .select("id, name, subject_id, display_order, is_inbox")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  if (subjectsRes.error) {
    console.error("[loadAdminTopicCatalog] subjects", subjectsRes.error.message);
  }
  if (topicsRes.error) {
    console.error("[loadAdminTopicCatalog] topics", topicsRes.error.message);
  }

  const subjects = (subjectsRes.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    shortName: (row.short_name as string | null) ?? null,
    track: row.track as string,
    year: Number(row.year),
  }));

  const topics = (topicsRes.data ?? []).map((row) => ({
    id: row.id as string,
    name: formatAdminTopicName(row.name as string, row.is_inbox as boolean),
    subjectId: row.subject_id as string,
    displayOrder: Number(row.display_order ?? 0),
  }));

  return { subjects, topics };
});
