import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BookOpen,
  Bone,
  Bug,
  Dna,
  FlaskConical,
  HeartPulse,
  Microscope,
  Pill,
  Scan,
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
  scan: Scan,
};

export function getSubjectIcon(iconName: string): LucideIcon {
  return subjectIconMap[iconName] ?? BookOpen;
}
