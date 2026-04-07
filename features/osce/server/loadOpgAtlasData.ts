import { z } from "zod";
import { OPG_ATLAS_TOPIC_ID } from "@/features/osce/constants/opgAtlas";
import type { OpgAtlasHotspot, OpgAtlasPanorama } from "@/features/osce/types";
import { createClient } from "@/lib/supabase/server";

const rawHotspotSchema = z.object({
  id: z.string(),
  x_percent: z.number(),
  y_percent: z.number(),
  radius_percent: z.number(),
  correct_label: z.string(),
  explanation: z.string(),
  clinical_significance: z.string().optional(),
});

const hotspotsColumnSchema = z.array(rawHotspotSchema);

export type LoadOpgAtlasResult =
  | { ok: true; panoramas: OpgAtlasPanorama[] }
  | { ok: false; message: string };

function mapHotspot(h: z.infer<typeof rawHotspotSchema>): OpgAtlasHotspot {
  return {
    id: h.id,
    x_percent: h.x_percent,
    y_percent: h.y_percent,
    radius_percent: h.radius_percent,
    name: h.correct_label,
    description: h.explanation.trim() ? h.explanation : "—",
    clinicalSignificance: (h.clinical_significance ?? "").trim(),
  };
}

export async function loadOpgAtlasData(): Promise<LoadOpgAtlasResult> {
  try {
    const supabase = await createClient();

    const { data: rows, error } = await supabase
      .from("questions")
      .select("id, text, image_url, hotspots")
      .eq("topic_id", OPG_ATLAS_TOPIC_ID)
      .eq("question_type", "image_identify")
      .eq("is_active", true)
      .order("text", { ascending: true });

    if (error) {
      console.error("[loadOpgAtlasData]", error.message);
      return {
        ok: false,
        message: "Nie udało się wczytać atlasu. Spróbuj ponownie później.",
      };
    }

    const panoramas: OpgAtlasPanorama[] = [];

    for (const row of rows ?? []) {
      const imageUrl =
        typeof row.image_url === "string" && row.image_url.length > 0
          ? row.image_url
          : null;

      if (!imageUrl) {
        continue;
      }

      const parsed = hotspotsColumnSchema.safeParse(row.hotspots ?? []);
      const rawHotspots = parsed.success ? parsed.data : [];
      const hotspots = rawHotspots.map(mapHotspot);
      hotspots.sort((a, b) => a.id.localeCompare(b.id, "pl"));

      panoramas.push({
        id: row.id as string,
        title: (row.text as string)?.trim() || "Panorama",
        imageUrl,
        hotspots,
      });
    }

    return { ok: true, panoramas };
  } catch (e) {
    console.error("[loadOpgAtlasData]", e);
    return {
      ok: false,
      message: "Wystąpił nieoczekiwany błąd.",
    };
  }
}
