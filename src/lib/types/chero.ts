/**
 * Tipos compartidos del dominio Chero.
 */

export type CheroMode = 'avanzo' | 'periodo' | 'parciales' | 'repaso';

export type UserType = 'bachiller' | 'universitario';

export interface UserProfile {
  id: string;
  email: string | null;
  age: number | null;
  is_minor: boolean;
  has_guardian_consent: boolean;
  user_type: UserType | null;
  institution: string | null;
  career: string | null;
  year: number | null;
  subjects: string[];
  preferred_voice: string;
  created_at: string;
  updated_at: string;
}

export interface DetectedContext {
  mode: CheroMode;
  subject: string;
  institution: string | null;
  year: number | null;
  topic: string;
  confidence: number;
}

export interface NoteQuestion {
  type: 'multiple_choice' | 'open' | 'completion' | 'problem' | 'essay' | 'case';
  prompt: string;
  options: string[] | null;
  correct: string | null;
  justification: string;
}

export interface NoteFlashcard {
  front: string;
  back: string;
}

export interface NoteConcept {
  name: string;
  definition: string;
  example: string;
}

export interface CheroNote {
  summary: string;
  concepts: NoteConcept[];
  questions: NoteQuestion[];
  flashcards: NoteFlashcard[];
  quick_review: string;
  mermaid_chart: string | null;
}

/**
 * @deprecated usar CheroNote — alias por compatibilidad
 */
export type ChroNote = CheroNote;

export interface UsageStatus {
  total_uses: number;
  user_uses: number;
  remaining_global: number;
  remaining_user: number;
  can_process: boolean;
  reason?: 'global_exhausted' | 'user_exhausted';
}
