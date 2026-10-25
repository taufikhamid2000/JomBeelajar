export interface Topic {
  id: string;
  name: string;
  description: string | null;
  difficulty_level: number | null;
  time_estimate_minutes: number | null;
  order_index: number;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  form: number;
  name: string; // Was previously called 'title', standardized as part of field naming conventions
  order_index: number;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  category?: string;
  category_priority?: number;
  order_index?: number;
}

export interface Quiz {
  id: string;
  name: string;
  created_by?: string;
  created_at?: string;
  verified: boolean;
  topic_id: string;
  timeLimit?: number | null; // seconds, from JomBeelajar API quiz-detail; null -> default
  email?: string;
  display_name?: string;
  questionCount?: number;
  subject_slug?: string; // Added for proper URL generation in profile page
  topic_title?: string; // Added for display purposes
}

export interface Question {
  id: string;
  quiz_id: string;
  text: string;
  type: 'radio' | 'checkbox';
  order_index: number;
  created_at: string;
  updated_at: string;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  question_id: string;
  text: string;
  is_correct?: boolean; // omitted for quiz takers — answer key stays server-side
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  completed: boolean;
  quiz_title?: string;
  subject?: string;
  topic?: string;
  time_taken?: number;
  created_at: string;
}

// New types for optimized quiz API
export interface TopicContext {
  topicTitle: string;
  chapterTitle: string;
  subjectName: string;
  form?: number;
}

export interface QuizWithQuestionsAndContext {
  quiz: Quiz;
  questions: Question[];
  topicContext: TopicContext;
}
