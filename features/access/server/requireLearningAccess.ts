import "server-only";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isUserAccessRevoked } from "@/lib/auth/accessRevocation";
import { hasActiveEntitlementForSelection } from "@/features/access/server/entitlements";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import {
  normalizeProduct,
  normalizeTrack,
  normalizeYear,
  isClinicalProduct,
  type StudyTrack,
  type StudyYear,
} from "@/features/access/lib/studyAccess";

type LearningAccessDenied = { ok: false; message: string };
type LearningAccessGranted = { ok: true; track: StudyTrack; year: StudyYear };

async function deniedMessage(): Promise<string> {
  const t = await getTranslations("session");
  return t("errors.noAccess");
}

export async function requireLearningAccessForSelection(
  userId: string,
  track: StudyTrack,
  year: StudyYear,
): Promise<LearningAccessGranted | LearningAccessDenied> {
  if (await isUserAccessRevoked(userId)) {
    return { ok: false, message: await deniedMessage() };
  }

  const profile = await getProfileByUserId(userId);
  const product = normalizeProduct(profile?.current_product);
  if (isClinicalProduct(product)) {
    return {
      ok: true,
      track: normalizeTrack(profile?.current_track ?? track),
      year: 1,
    };
  }

  const allowed = await hasActiveEntitlementForSelection(userId, track, year);
  if (!allowed) {
    return { ok: false, message: await deniedMessage() };
  }

  return { ok: true, track, year };
}

export async function requireLearningAccessForProfile(
  userId: string,
): Promise<LearningAccessGranted | LearningAccessDenied> {
  const profile = await getProfileByUserId(userId);
  const product = normalizeProduct(profile?.current_product);
  if (isClinicalProduct(product)) {
    return {
      ok: true,
      track: normalizeTrack(profile?.current_track),
      year: 1,
    };
  }
  return requireLearningAccessForSelection(
    userId,
    normalizeTrack(profile?.current_track),
    normalizeYear(profile?.current_year),
  );
}

export async function requireLearningAccessForSubject(
  userId: string,
  subjectId: string,
): Promise<LearningAccessGranted | LearningAccessDenied> {
  const supabase = await createClient();
  const { data: subject, error } = await supabase
    .from("subjects")
    .select("track, year, product")
    .eq("id", subjectId)
    .maybeSingle();

  if (error || !subject) {
    return { ok: false, message: await deniedMessage() };
  }

  const profile = await getProfileByUserId(userId);
  const userProduct = normalizeProduct(profile?.current_product as string | null | undefined);
  const subjectProduct = normalizeProduct(subject.product as string | null | undefined);

  if (isClinicalProduct(subjectProduct)) {
    if (userProduct !== subjectProduct) {
      return { ok: false, message: await deniedMessage() };
    }
    return {
      ok: true,
      track: normalizeTrack(subject.track as string),
      year: 1,
    };
  }

  return requireLearningAccessForSelection(
    userId,
    normalizeTrack(subject.track as string),
    normalizeYear(subject.year as number | null | undefined),
  );
}
