import type { TablerIcon } from "@tabler/icons-react";
import {
  IconActivity,
  IconBabyCarriage,
  IconBolt,
  IconBone,
  IconBook,
  IconBraces,
  IconBug,
  IconBuildingHospital,
  IconCertificate,
  IconClipboardCheck,
  IconCrown,
  IconDental,
  IconDentalBroken,
  IconDna,
  IconFlask,
  IconFlask2,
  IconGavel,
  IconHeartHandshake,
  IconHeartRateMonitor,
  IconLanguage,
  IconMicroscope,
  IconNeedle,
  IconPhotoScan,
  IconPill,
  IconScan,
  IconScissors,
  IconShieldPlus,
  IconSkull,
  IconStethoscope,
  IconUsers,
  IconVirus,
} from "@tabler/icons-react";

/** Klucze `subjects.icon_name` → ikony Tabler (health / dental / nauki podstawowe). */
export const subjectIconMap: Record<string, TablerIcon> = {
  // — semantyczne (preferowane w DB) —
  bone: IconBone,
  language: IconLanguage,
  microscope: IconMicroscope,
  bolt: IconBolt,
  dna: IconDna,
  flask: IconFlask,
  "flask-2": IconFlask2,
  scan: IconScan,
  "clipboard-check": IconClipboardCheck,
  "heart-rate": IconHeartRateMonitor,
  bug: IconBug,
  virus: IconVirus,
  pill: IconPill,
  crown: IconCrown,
  scissors: IconScissors,
  skull: IconSkull,
  "photo-scan": IconPhotoScan,
  hospital: IconBuildingHospital,
  gavel: IconGavel,
  dental: IconDental,
  "dental-broken": IconDentalBroken,
  needle: IconNeedle,
  braces: IconBraces,
  "baby-carriage": IconBabyCarriage,
  "heart-handshake": IconHeartHandshake,
  book: IconBook,
  users: IconUsers,
  stethoscope: IconStethoscope,
  "shield-plus": IconShieldPlus,
  activity: IconActivity,
  certificate: IconCertificate,

  // — legacy (Lucide / stare seedy; mapowanie do Tabler) —
  "book-open": IconBook,
  "heart-pulse": IconHeartRateMonitor,
  zap: IconBolt,
  "flask-conical": IconFlask,
  "flask-round": IconFlask2,
  "shield-alert": IconVirus,
  shield: IconShieldPlus,
  languages: IconLanguage,
};

/** Stałe mapowanie LDEW — nie polegamy wyłącznie na `icon_name` w DB. */
export const ldewSubjectIconById: Record<string, TablerIcon> = {
  "ldew-stomatologia-zachowawcza": IconDental,
  "ldew-endodoncja": IconNeedle,
  "ldew-periodontologia": IconDentalBroken,
  "ldew-choroby-sluzowki": IconMicroscope,
  "ldew-stomatologia-dziecieca": IconBabyCarriage,
  "ldew-ortodoncja": IconBraces,
  "ldew-protetyka": IconCrown,
  "ldew-chirurgia-stomatologiczna": IconScissors,
  "ldew-chirurgia-szczekowo-twarzowa": IconSkull,
  "ldew-radiologia": IconPhotoScan,
  "ldew-zdrowie-publiczne": IconBuildingHospital,
  "ldew-orzecznictwo": IconGavel,
};

export function getSubjectIconComponent(
  iconName: string,
  subjectId?: string,
): TablerIcon {
  if (subjectId && subjectId in ldewSubjectIconById) {
    return ldewSubjectIconById[subjectId];
  }
  return subjectIconMap[iconName] ?? IconBook;
}
