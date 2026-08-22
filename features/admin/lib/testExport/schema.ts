import { z } from "zod";
import { MAX_TEST_QUESTIONS } from "@/features/admin/lib/testExport/types";

export const testExportRequestSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(180).optional(),
  product: z.enum(["ldek", "ldew"]),
  track: z.enum(["stomatologia", "lekarski"]),
  source: z.enum(["all", "reference", "own"]),
  cemSessionIds: z.array(z.string().min(1)).max(80).default([]),
  topics: z
    .array(
      z.object({
        topicId: z.string().min(1),
        count: z.number().int().min(0).max(MAX_TEST_QUESTIONS),
      }),
    )
    .min(1)
    .max(200),
  shuffle: z.boolean(),
  seed: z.number().int().optional(),
  includeKeyAtEnd: z.boolean(),
  includeKeyFile: z.boolean(),
  includeExplanationsFile: z.boolean(),
});

export type TestExportRequestParsed = z.infer<typeof testExportRequestSchema>;
