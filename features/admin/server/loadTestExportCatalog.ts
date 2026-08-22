import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAccess } from "@/features/admin/server/adminAuth";
import { formatAdminTopicName } from "@/features/admin/lib/formatAdminTopicName";
import type {
  TestExportProduct,
  TestExportTrack,
  TopicSourceCount,
} from "@/features/admin/lib/testExport/types";

const PAGE_SIZE = 1000;
const IN_CHUNK = 80;

export type TestExportCatalogSubject = {
  id: string;
  name: string;
  shortName: string | null;
  product: TestExportProduct;
  track: TestExportTrack;
  year: number;
  displayOrder: number;
};

export type TestExportCatalogTopic = {
  id: string;
  name: string;
  subjectId: string;
  displayOrder: number;
};

export type TestExportCatalogSession = {
  id: string;
  product: TestExportProduct;
  label: string;
  shortCode: string | null;
  ordinal: number | null;
  heldOn: string | null;
  isPublished: boolean;
};

export type TestExportCatalog = {
  subjects: TestExportCatalogSubject[];
  topics: TestExportCatalogTopic[];
  counts: TopicSourceCount[];
  sessions: TestExportCatalogSession[];
};

function isProduct(value: unknown): value is TestExportProduct {
  return value === "ldek" || value === "ldew";
}

function isTrack(value: unknown): value is TestExportTrack {
  return value === "stomatologia" || value === "lekarski";
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export const loadTestExportCatalog = cache(async (): Promise<TestExportCatalog> => {
  await requireAdminAccess();
  const admin = createAdminClient();

  const [subjectsRes, sessionsRes] = await Promise.all([
    admin
      .from("subjects")
      .select("id, name, short_name, product, track, year, display_order")
      .in("product", ["ldek", "ldew"])
      .order("product", { ascending: true })
      .order("track", { ascending: true })
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
    admin
      .from("cem_sessions")
      .select("id, product, label, short_code, ordinal, held_on, is_published")
      .in("product", ["ldek", "ldew"])
      .order("ordinal", { ascending: true, nullsFirst: false })
      .order("held_on", { ascending: false }),
  ]);

  if (subjectsRes.error) {
    console.error("[loadTestExportCatalog] subjects", subjectsRes.error.message);
  }
  if (sessionsRes.error) {
    console.error("[loadTestExportCatalog] sessions", sessionsRes.error.message);
  }

  const subjects: TestExportCatalogSubject[] = (subjectsRes.data ?? [])
    .filter((row) => isProduct(row.product) && isTrack(row.track))
    .map((row) => ({
      id: row.id as string,
      name: row.name as string,
      shortName: (row.short_name as string | null) ?? null,
      product: row.product as TestExportProduct,
      track: row.track as TestExportTrack,
      year: Number(row.year),
      displayOrder: Number(row.display_order ?? 0),
    }));

  const subjectIds = subjects.map((s) => s.id);
  if (subjectIds.length === 0) {
    return { subjects: [], topics: [], counts: [], sessions: [] };
  }

  const topicRows: Array<{
    id: string;
    name: string;
    subject_id: string;
    display_order: number | null;
    is_inbox: boolean | null;
  }> = [];

  for (const ids of chunk(subjectIds, IN_CHUNK)) {
    const { data, error } = await admin
      .from("topics")
      .select("id, name, subject_id, display_order, is_inbox")
      .in("subject_id", ids)
      .eq("is_inbox", false)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) {
      console.error("[loadTestExportCatalog] topics", error.message);
      break;
    }
    topicRows.push(...((data ?? []) as typeof topicRows));
  }

  const topics: TestExportCatalogTopic[] = topicRows.map((row) => ({
    id: row.id,
    name: formatAdminTopicName(row.name, row.is_inbox),
    subjectId: row.subject_id,
    displayOrder: Number(row.display_order ?? 0),
  }));

  const topicIds = topics.map((t) => t.id);
  const aggregate = new Map<string, TopicSourceCount>();

  for (const ids of chunk(topicIds, IN_CHUNK)) {
    let from = 0;
    while (true) {
      const { data, error } = await admin
        .from("questions")
        .select("topic_id, source, first_seen_session")
        .in("topic_id", ids)
        .eq("is_active", true)
        .eq("question_type", "single_choice")
        .range(from, from + PAGE_SIZE - 1);
      if (error) {
        console.error("[loadTestExportCatalog] questions", error.message);
        break;
      }
      const batch = data ?? [];
      for (const row of batch) {
        const topicId = row.topic_id as string;
        const source = (row.source as string | null) ?? "own";
        const firstSeenSession = (row.first_seen_session as string | null) ?? null;
        const key = `${topicId}::${source}::${firstSeenSession ?? ""}`;
        const existing = aggregate.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          aggregate.set(key, { topicId, source, firstSeenSession, count: 1 });
        }
      }
      if (batch.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
  }

  const sessions: TestExportCatalogSession[] = (sessionsRes.data ?? [])
    .filter((row) => isProduct(row.product))
    .map((row) => ({
      id: row.id as string,
      product: row.product as TestExportProduct,
      label: (row.label as string) ?? row.id,
      shortCode: (row.short_code as string | null) ?? null,
      ordinal: (row.ordinal as number | null) ?? null,
      heldOn: (row.held_on as string | null) ?? null,
      isPublished: row.is_published === true,
    }));

  return {
    subjects,
    topics,
    counts: [...aggregate.values()],
    sessions,
  };
});
