export type OsceStation = {
  id: string;
  name: string;
  short_name: string;
  display_order: number;
  exam_day: number | null;
  exam_tasks: { task_number: number; description: string }[] | null;
  competencies: { code: string; description: string }[] | null;
  pass_threshold: number | null;
  exam_info: { format: string; tip: string; source?: string } | null;
  question_count: number;
  answered_questions: number;
};

export type OsceTopic = {
  id: string;
  subject_id: string;
  name: string;
  display_order: number;
  question_count: number;
};

/** Wiersz z Supabase dla TopicSession (pytania aktywne w temacie). */
export type TopicSessionQuestionRow = {
  id: string;
  text: string;
  options: unknown;
  correct_option_id: string;
  explanation: string;
  image_url: string | null;
  question_type: string | null;
  timer_seconds: number | null;
  /** JSONB / tablica stringów — kolejność przy pytaniach typu ordering */
  correct_order: unknown | null;
  learning_outcome: string | null;
  /** JSONB — image_identify / atlas OPG */
  hotspots: unknown | null;
  /** JSONB — conversion_drill */
  drill_questions: unknown | null;
  /** np. identify | label */
  identify_mode: string | null;
};

/** Hotspot w atlasie OPG (kolumna `questions.hotspots` JSONB). */
export type OpgAtlasHotspot = {
  id: string;
  x_percent: number;
  y_percent: number;
  radius_percent: number;
  name: string;
  description: string;
  clinicalSignificance: string;
};

export type OpgAtlasPanorama = {
  id: string;
  title: string;
  imageUrl: string;
  hotspots: OpgAtlasHotspot[];
};
