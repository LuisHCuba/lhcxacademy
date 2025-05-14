import type { Database } from './supabase';

// Tipos para as tabelas específicas
export type User = Database['public']['Tables']['users']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];
export type Track = Database['public']['Tables']['tracks']['Row'];
export type Video = Database['public']['Tables']['videos']['Row'];
export type Assignment = Database['public']['Tables']['assignments']['Row'];
export type Progress = Database['public']['Tables']['progress']['Row'];
export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row'];
export type QuizAnswer = Database['public']['Tables']['quiz_answers']['Row'];
export type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row'];
export type Certificate = Database['public']['Tables']['certificates']['Row'] & {
  downloaded?: boolean;
  download_date?: string;
};

// Tipo estendido para quiz_answers para incluir order_index
export interface QuizAnswerExtended extends QuizAnswer {
  order_index: number;  // Campo virtual usado apenas na aplicação (não existe na tabela do banco de dados)
}

// Tipos de inserção
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type DepartmentInsert = Database['public']['Tables']['departments']['Insert'];
export type TrackInsert = Database['public']['Tables']['tracks']['Insert'];
export type VideoInsert = Database['public']['Tables']['videos']['Insert'];
export type AssignmentInsert = Database['public']['Tables']['assignments']['Insert'];
export type ProgressInsert = Database['public']['Tables']['progress']['Insert'];
export type QuizQuestionInsert = Database['public']['Tables']['quiz_questions']['Insert'];
export type QuizAnswerInsert = Database['public']['Tables']['quiz_answers']['Insert'];
export type QuizAttemptInsert = Database['public']['Tables']['quiz_attempts']['Insert'];
export type CertificateInsert = Database['public']['Tables']['certificates']['Insert'];

// Tipos de atualização
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type DepartmentUpdate = Database['public']['Tables']['departments']['Update'];
export type TrackUpdate = Database['public']['Tables']['tracks']['Update'];
export type VideoUpdate = Database['public']['Tables']['videos']['Update'];
export type AssignmentUpdate = Database['public']['Tables']['assignments']['Update'];
export type ProgressUpdate = Database['public']['Tables']['progress']['Update'];
export type QuizQuestionUpdate = Database['public']['Tables']['quiz_questions']['Update'];
export type QuizAnswerUpdate = Database['public']['Tables']['quiz_answers']['Update'];
export type QuizAttemptUpdate = Database['public']['Tables']['quiz_attempts']['Update'];
export type CertificateUpdate = Database['public']['Tables']['certificates']['Update'];

// Tipos para agregações e dados com relacionamentos
export interface DepartmentWithUserCount extends Department {
  user_count: number;
}

// Interface estendida para Track para incluir propriedades adicionais
export interface TrackWithExtras extends Track {
  lessons_count?: number;
}

export interface TrackWithProgress {
  id: number;
  name: string;
  description: string;
  type: 'track' | 'pill' | 'grid';
  thumbnail_url: string | null;
  total_videos: number;
  completed_videos: number; 
  progress_percentage: number;
}

export interface VideoWithProgress {
  id: number;
  title: string;
  description: string;
  youtube_id: string;
  estimated_duration: number;
  order_index: number;
  track_id: number;
  track_name?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  watch_time: number;
}

export interface AssignmentWithDetails extends Assignment {
  department?: Department | null;
  track?: Track | null;
}

export interface UserWithDepartment extends User {
  department?: Department | null;
}

export interface QuizQuestionWithAnswers extends QuizQuestion {
  answers: QuizAnswerExtended[];  // Usar tipo estendido aqui
}

// Interface para a lição/aula
export interface Lesson {
  id: number;
  title: string;
  description?: string;
  type: 'video' | 'quiz' | 'document';
  duration?: number;
  track_id: number;
  order_index: number;
  status?: 'published' | 'draft' | 'unavailable';
  created_at: string;
  created_by: string;
}

// Tipos para contexto de autenticação
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null, user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
}

// Estados de UI para diferentes telas
export type SortDirection = 'asc' | 'desc';

export interface TableState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  sortField: keyof T | null;
  sortDirection: SortDirection;
  searchTerm: string;
  page: number;
  pageSize: number;
  totalCount: number;
}

// Tipos para filtros
export interface UserFilters {
  role?: string | null;
  department_id?: number | null;
  search?: string | null;
}

export interface TrackFilters {
  type?: 'track' | 'pill' | 'grid' | null;
}

export interface AssignmentFilters {
  id?: number | null;
  department_id?: number | null;
  track_id?: number | null;
  start_date?: string | null;
  due_date?: string | null;
  status?: 'not_started' | 'in_progress' | 'completed' | 'expired' | null;
}

// Tipos para estatísticas
export interface AssignmentStats {
  total: number;
  completed: number;
  active: number;
  expired: number;
} 