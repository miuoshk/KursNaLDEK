import JSZip from "jszip";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildExplanationsDocument,
  buildKeyDocument,
  buildTestDocument,
  type QuestionImageMap,
} from "@/features/admin/lib/testExport/buildDocuments";
import { testExportFileNames } from "@/features/admin/lib/testExport/fileNames";
import {
  fitImageSize,
  readImageSize,
  sniffImageType,
  type EmbeddedImage,
} from "@/features/admin/lib/testExport/imageMeta";
import { formatSelectError, selectQuestions } from "@/features/admin/lib/testExport/selectQuestions";
import type { TestExportRequestParsed } from "@/features/admin/lib/testExport/schema";
import type {
  SelectableQuestion,
  SelectedTestQuestion,
  TestExportManifest,
} from "@/features/admin/lib/testExport/types";

const PAGE_SIZE = 1000;
const IN_CHUNK = 80;
const IMAGE_CONCURRENCY = 6;
const IMAGE_TIMEOUT_MS = 8000;

export type GeneratedTestExport = {
  buffer: Buffer;
  filename: string;
  contentType: string;
};

export class TestExportUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TestExportUserError";
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function parseOptions(raw: unknown): { id: string; text: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = row as { id?: unknown; text?: unknown };
      return { id: String(r.id ?? ""), text: String(r.text ?? "") };
    })
    .filter((row) => row.id);
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index]!);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

async function fetchImage(url: string): Promise<EmbeddedImage | "missing"> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return "missing";
    const buf = Buffer.from(await res.arrayBuffer());
    const type = sniffImageType(buf, res.headers.get("content-type"));
    if (!type) return "missing";
    const size = readImageSize(buf, type) ?? { width: 500, height: 330 };
    const fitted = fitImageSize(size.width, size.height);
    return { data: buf, type, width: fitted.width, height: fitted.height };
  } catch {
    return "missing";
  } finally {
    clearTimeout(timer);
  }
}

export async function generateTestExport(
  input: TestExportRequestParsed,
): Promise<GeneratedTestExport> {
  const admin = createAdminClient();
  const quotas = input.topics.filter((t) => t.count > 0);
  const topicIds = [...new Set(quotas.map((t) => t.topicId))];
  if (topicIds.length === 0) {
    throw new TestExportUserError("Zaznacz przynajmniej jeden temat i podaj liczbę pytań.");
  }

  const allowedTopics = new Set<string>();
  for (const ids of chunk(topicIds, IN_CHUNK)) {
    const { data, error } = await admin
      .from("topics")
      .select("id, is_inbox, subjects!inner(id, product, track)")
      .in("id", ids)
      .eq("is_inbox", false)
      .eq("subjects.product", input.product)
      .eq("subjects.track", input.track);
    if (error) {
      console.error("[generateTestExport] topics", error.message);
      throw new TestExportUserError("Nie udało się wczytać tematów.");
    }
    for (const row of data ?? []) {
      allowedTopics.add(row.id as string);
    }
  }

  const missing = topicIds.filter((id) => !allowedTopics.has(id));
  if (missing.length > 0) {
    throw new TestExportUserError(
      `Tematy spoza wybranego produktu/kierunku: ${missing.slice(0, 5).join(", ")}.`,
    );
  }

  if (input.cemSessionIds.length > 0) {
    const { data, error } = await admin
      .from("cem_sessions")
      .select("id")
      .eq("product", input.product)
      .in("id", input.cemSessionIds);
    if (error) {
      console.error("[generateTestExport] sessions", error.message);
      throw new TestExportUserError("Nie udało się sprawdzić sesji CEM.");
    }
    const ok = new Set((data ?? []).map((row) => row.id as string));
    const bad = input.cemSessionIds.filter((id) => !ok.has(id));
    if (bad.length > 0) {
      throw new TestExportUserError("Wybrano sesję CEM spoza tego produktu.");
    }
  }

  const pool: SelectableQuestion[] = [];
  for (const ids of chunk(topicIds, IN_CHUNK)) {
    let from = 0;
    while (true) {
      const { data, error } = await admin
        .from("questions")
        .select(
          "id, topic_id, text, options, correct_option_id, explanation, source, first_seen_session, image_url",
        )
        .in("topic_id", ids)
        .eq("is_active", true)
        .eq("question_type", "single_choice")
        .range(from, from + PAGE_SIZE - 1);
      if (error) {
        console.error("[generateTestExport] questions", error.message);
        throw new TestExportUserError("Nie udało się wczytać pytań.");
      }
      const batch = data ?? [];
      for (const row of batch) {
        pool.push({
          id: row.id as string,
          topicId: row.topic_id as string,
          source: (row.source as string | null) ?? "own",
          firstSeenSession: (row.first_seen_session as string | null) ?? null,
          text: (row.text as string) ?? "",
          options: parseOptions(row.options),
          correctOptionId: (row.correct_option_id as string) ?? "",
          explanation: (row.explanation as string) ?? "",
          imageUrl: (row.image_url as string | null) ?? null,
        });
      }
      if (batch.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
  }

  const seed = input.seed ?? Math.floor(Math.random() * 0xffffffff);
  const selected = selectQuestions({
    pool,
    quotas,
    source: input.source,
    product: input.product,
    cemSessionIds: input.cemSessionIds,
    shuffle: input.shuffle,
    seed,
  });

  if (!selected.ok) {
    throw new TestExportUserError(formatSelectError(selected.error));
  }

  const questions: SelectedTestQuestion[] = selected.questions;
  const images = await loadQuestionImages(questions);
  const generatedAt = new Date();
  const meta = {
    title: input.title,
    subtitle: input.subtitle?.trim() || undefined,
    generatedAt,
    questionCount: questions.length,
  };
  const names = testExportFileNames(input.title, generatedAt);

  const files: { name: string; data: Buffer }[] = [
    {
      name: names.test,
      data: await buildTestDocument({
        questions,
        meta,
        includeKeyAtEnd: input.includeKeyAtEnd,
        images,
      }),
    },
  ];

  if (input.includeKeyFile) {
    files.push({
      name: names.key,
      data: await buildKeyDocument({ questions, meta }),
    });
  }
  if (input.includeExplanationsFile) {
    files.push({
      name: names.explanations,
      data: await buildExplanationsDocument({ questions, meta }),
    });
  }

  if (files.length === 1) {
    return {
      buffer: files[0]!.data,
      filename: files[0]!.name,
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }

  const manifest: TestExportManifest = {
    generatedAt: generatedAt.toISOString(),
    title: input.title,
    subtitle: input.subtitle?.trim() || null,
    product: input.product,
    track: input.track,
    source: input.source,
    cemSessionIds: input.cemSessionIds,
    shuffle: input.shuffle,
    seed,
    questionIds: questions.map((q) => q.id),
    quotas,
  };

  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.name, file.data);
  }
  zip.file(names.manifest, JSON.stringify(manifest, null, 2));
  const buffer = Buffer.from(
    await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
    }),
  );

  return {
    buffer,
    filename: names.zip,
    contentType: "application/zip",
  };
}

async function loadQuestionImages(
  questions: SelectedTestQuestion[],
): Promise<QuestionImageMap> {
  const map: QuestionImageMap = new Map();
  const withUrl = questions.filter((q) => q.imageUrl);
  await mapLimit(withUrl, IMAGE_CONCURRENCY, async (question) => {
    const result = await fetchImage(question.imageUrl as string);
    map.set(question.id, result);
  });
  return map;
}
