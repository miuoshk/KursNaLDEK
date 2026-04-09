import type { SessionMode } from "@/features/session/types";

export type SettingsProfile = {
  display_name: string;
  avatar_initials: string | null;
  current_track: string;
  current_year: number;
  /** ISO 8601 (TIMESTAMPTZ) lub null */
  exam_date: string | null;
  daily_goal: number;
  default_session_mode: SessionMode;
  default_question_count: number;
  notifications_reviews: boolean;
  notifications_weekly: boolean;
  subscription_status: string | null;
  subscription_ends_at: string | null;
  stripe_customer_id: string | null;
};
