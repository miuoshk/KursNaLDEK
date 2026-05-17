import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BookOpen,
  Bone,
  Bug,
  ClipboardCheck,
  Dna,
  FlaskConical,
  HeartPulse,
  Languages,
  Microscope,
  Pill,
  Scan,
  Users,
  Zap,
} from "lucide-react";

export const subjectIconMap: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  bone: Bone,
  microscope: Microscope,
  zap: Zap,
  "flask-conical": FlaskConical,
  dna: Dna,
  "heart-pulse": HeartPulse,
  bug: Bug,
  pill: Pill,
  activity: Activity,
  "clipboard-check": ClipboardCheck,
  scan: Scan,
  languages: Languages,
  users: Users,
};

export function getSubjectIcon(iconName: string): LucideIcon {
  return subjectIconMap[iconName] ?? BookOpen;
}
