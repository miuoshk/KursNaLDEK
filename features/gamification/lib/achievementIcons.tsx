import type { LucideIcon } from "lucide-react";
import {
  Award,
  Calendar,
  CalendarCheck,
  Globe,
  Hash,
  Moon,
  Rocket,
  Star,
  Sunrise,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Rocket,
  Hash,
  Trophy,
  Zap,
  Star,
  Target,
  Calendar,
  CalendarCheck,
  Award,
  Globe,
  Moon,
  Sunrise,
};

export function achievementLucide(icon: string): LucideIcon {
  return MAP[icon] ?? Award;
}
