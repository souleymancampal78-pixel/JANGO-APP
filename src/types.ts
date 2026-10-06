export interface ChatAttachment {
  name: string;
  mimeType: string;
  base64: string;
  previewUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  attachment?: ChatAttachment;
  isVoiceInput?: boolean;
  feedback?: 'up' | 'down' | null;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  mode: 'general' | 'math' | 'french' | 'voice';
  level: 'college' | 'lycee' | 'superieur' | 'primaire';
}

export type SubjectMode = 'general' | 'math' | 'french' | 'voice';
export type AcademicLevel = 'college' | 'lycee' | 'superieur' | 'primaire';
export type ThemeMode = 'dark' | 'light';
export type MathDetailLevel = 'summary' | 'standard' | 'ultra';

export interface StudyTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface StudyDay {
  dayName: string;
  focus: string;
  durationMinutes: number;
  priority: 'Haute' | 'Moyenne' | 'Normale';
  tasks: StudyTask[];
  tip?: string;
}

export interface StudyPlan {
  id: string;
  createdAt: number;
  summary: string;
  level: string;
  goals: string[];
  days: StudyDay[];
  advice: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizData {
  topic: string;
  level: string;
  questions: QuizQuestion[];
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  category?: string;
  definition: string;
  etymology: string;
  example?: string;
  pedagogicalTip?: string;
}

