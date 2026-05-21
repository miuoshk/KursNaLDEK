"use server";

import { requireAdminAccess } from "@/features/admin/server/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export type UploadQuestionImageResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

function sanitizeExtension(name: string, mime: string): string {
  const fromName = name.split(".").pop()?.toLowerCase();
  if (fromName && ALLOWED_EXT.has(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export async function uploadQuestionImage(
  formData: FormData,
): Promise<UploadQuestionImageResult> {
  await requireAdminAccess();

  const questionId = formData.get("questionId");
  const file = formData.get("file");

  if (typeof questionId !== "string" || questionId.trim().length === 0) {
    return { ok: false, message: "Brak ID pytania." };
  }
  if (!(file instanceof File)) {
    return { ok: false, message: "Nie wybrano pliku." };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return {
      ok: false,
      message: "Dozwolone formaty: JPEG, PNG, WebP, GIF.",
    };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "Plik jest za duży (maks. 5 MB)." };
  }

  const ext = sanitizeExtension(file.name, file.type);
  const path = `${questionId.trim()}/${Date.now()}.${ext}`;
  const admin = createAdminClient();
  const body = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from("question-images").upload(path, body, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("[uploadQuestionImage]", error.message);
    return { ok: false, message: "Nie udało się przesłać obrazu." };
  }

  const { data } = admin.storage.from("question-images").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
