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

export type AdminTopicCatalogConcept = {
  id: string;
  name: string;
  subjectId: string;
  topicId: string | null;
  parentId: string | null;
  source: string;
};

export type AdminTopicCatalog = {
  subjects: AdminTopicCatalogSubject[];
  topics: AdminTopicCatalogTopic[];
  concepts: AdminTopicCatalogConcept[];
};

export const loadAdminTopicCatalog = cache(
  async (): Promise<AdminTopicCatalog> => {
    const admin = createAdminClient();

    const [subjectsRes, topicsRes, conceptsRes] = await Promise.all([
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
      admin
        .from("concepts")
        .select("id, name, subject_id, topic_id, parent_id, source")
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

    if (subjectsRes.error) {
      console.error(
        "[loadAdminTopicCatalog] subjects",
        subjectsRes.error.message,
      );
    }
    if (topicsRes.error) {
      console.error("[loadAdminTopicCatalog] topics", topicsRes.error.message);
    }
    if (conceptsRes.error) {
      console.error(
        "[loadAdminTopicCatalog] concepts",
        conceptsRes.error.message,
      );
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

    const concepts = (conceptsRes.data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      subjectId: row.subject_id as string,
      topicId: (row.topic_id as string | null) ?? null,
      parentId: (row.parent_id as string | null) ?? null,
      source: row.source as string,
    }));

    return { subjects, topics, concepts };
  },
);
