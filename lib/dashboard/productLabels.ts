import {
  isClinicalProduct,
  type StudyProduct,
} from "@/features/access/lib/studyAccess";

type CommonLabelTranslator = (
  key:
    | "appName"
    | "appNameLdew"
    | "appNameLdek"
    | "yearPrefix"
    | "yearProfileLine"
    | "profileLineLdew"
    | "profileLineLdek"
    | "breadcrumbLdew"
    | "breadcrumbLdek",
  values?: Record<string, string | number>,
) => string;

type SubjectsLabelTranslator = (
  key: "yearTrackLine" | "ldewTrackLine" | "ldekTrackLine" | "overallProgressYear" | "overallProgressLdew" | "overallProgressLdek",
  values?: Record<string, string | number>,
) => string;

export function appNameForProduct(
  product: StudyProduct,
  t: CommonLabelTranslator,
): string {
  if (product === "ldew") return t("appNameLdew");
  if (product === "ldek") return t("appNameLdek");
  return t("appName");
}

export function breadcrumbRootForProduct(
  product: StudyProduct,
  year: number,
  t: CommonLabelTranslator,
): string {
  if (product === "ldew") return t("breadcrumbLdew");
  if (product === "ldek") return t("breadcrumbLdek");
  return t("yearPrefix", { year });
}

export function profileLineForProduct(
  product: StudyProduct,
  year: number,
  trackLabel: string,
  streak: string,
  t: CommonLabelTranslator,
): string {
  if (product === "ldew") return t("profileLineLdew", { streak });
  if (product === "ldek") return t("profileLineLdek", { streak });
  return t("yearProfileLine", { year, trackLabel, streak });
}

export function subjectsSubtitleForProduct(
  product: StudyProduct,
  year: number,
  trackLabel: string,
  t: SubjectsLabelTranslator,
): string {
  if (product === "ldew") return t("ldewTrackLine", { track: trackLabel });
  if (product === "ldek") return t("ldekTrackLine", { track: trackLabel });
  return t("yearTrackLine", { year, track: trackLabel });
}

export function overallProgressTitleForProduct(
  product: StudyProduct,
  year: number,
  t: SubjectsLabelTranslator,
): string {
  if (product === "ldew") return t("overallProgressLdew");
  if (product === "ldek") return t("overallProgressLdek");
  return t("overallProgressYear", { year });
}

export function shouldShowSavedQuestions(product: StudyProduct): boolean {
  return !isClinicalProduct(product);
}
