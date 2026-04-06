export interface Subject {
  id: string;
  name: string;
  short_name: string;
  icon_name: string;
  year: number;
  track: string;
  product: string;
  display_order: number;
}

export interface SubjectWithProgress extends Subject {
  question_count: number;
  topic_count: number;
  mastery_percentage: number;
  last_studied_at: string | null;
  due_reviews: number;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  display_order: number;
  question_count: number;
}
