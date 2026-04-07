export type OsceStation = {
  id: string;
  name: string;
  short_name: string;
  display_order: number;
  exam_day: number | null;
  exam_tasks: string | null;
};

export type OsceTopic = {
  id: string;
  subject_id: string;
  name: string;
  display_order: number;
  question_count: number;
};
