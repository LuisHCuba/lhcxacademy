export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          department_id: number | null
          role: 'admin' | 'instructor' | 'collaborator'
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          avatar_url?: string | null
          department_id?: number | null
          role?: 'admin' | 'instructor' | 'collaborator'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          department_id?: number | null
          role?: 'admin' | 'instructor' | 'collaborator'
          created_at?: string
        }
      }
      departments: {
        Row: {
          id: number
          name: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          created_at?: string
        }
      }
      tracks: {
        Row: {
          id: number
          name: string
          description: string
          type: 'track' | 'pill' | 'grid'
          thumbnail_url: string | null
          created_at: string
          created_by: string
        }
        Insert: {
          id?: number
          name: string
          description: string
          type: 'track' | 'pill' | 'grid'
          thumbnail_url?: string | null
          created_at?: string
          created_by: string
        }
        Update: {
          id?: number
          name?: string
          description?: string
          type?: 'track' | 'pill' | 'grid'
          thumbnail_url?: string | null
          created_at?: string
          created_by?: string
        }
      }
      videos: {
        Row: {
          id: number
          title: string
          description: string
          youtube_id: string
          estimated_duration: number
          order_index: number
          track_id: number
          created_at: string
          created_by: string
        }
        Insert: {
          id?: number
          title: string
          description: string
          youtube_id: string
          estimated_duration: number
          order_index: number
          track_id: number
          created_at?: string
          created_by: string
        }
        Update: {
          id?: number
          title?: string
          description?: string
          youtube_id?: string
          estimated_duration?: number
          order_index?: number
          track_id?: number
          created_at?: string
          created_by?: string
        }
      }
      assignments: {
        Row: {
          id: number
          track_id: number | null
          user_id: string | null
          department_id: number | null
          start_date: string
          due_date: string
          status: 'not_started' | 'in_progress' | 'completed' | 'expired'
          created_at: string
          created_by: string
        }
        Insert: {
          id?: number
          track_id?: number | null
          user_id?: string | null
          department_id?: number | null
          start_date: string
          due_date: string
          status?: 'not_started' | 'in_progress' | 'completed' | 'expired'
          created_at?: string
          created_by: string
        }
        Update: {
          id?: number
          track_id?: number | null
          user_id?: string | null
          department_id?: number | null
          start_date?: string
          due_date?: string
          status?: 'not_started' | 'in_progress' | 'completed' | 'expired'
          created_at?: string
          created_by?: string
        }
      }
      progress: {
        Row: {
          id: number
          user_id: string
          video_id: number
          status: 'not_started' | 'in_progress' | 'completed'
          watch_time: number
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          video_id: number
          status?: 'not_started' | 'in_progress' | 'completed'
          watch_time?: number
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          video_id?: number
          status?: 'not_started' | 'in_progress' | 'completed'
          watch_time?: number
          completed_at?: string | null
          created_at?: string
        }
      }
      quiz_questions: {
        Row: {
          id: number
          track_id: number
          question_text: string
          time_limit: number
          created_at: string
          created_by: string
        }
        Insert: {
          id?: number
          track_id: number
          question_text: string
          time_limit: number
          created_at?: string
          created_by: string
        }
        Update: {
          id?: number
          track_id?: number
          question_text?: string
          time_limit?: number
          created_at?: string
          created_by?: string
        }
      }
      quiz_answers: {
        Row: {
          id: number
          question_id: number
          answer_text: string
          is_correct: boolean
          created_at: string
        }
        Insert: {
          id?: number
          question_id: number
          answer_text: string
          is_correct: boolean
          created_at?: string
        }
        Update: {
          id?: number
          question_id?: number
          answer_text?: string
          is_correct?: boolean
          created_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: number
          user_id: string
          question_id: number
          answer_id: number
          response_time: number
          is_correct: boolean
          score: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          question_id: number
          answer_id: number
          response_time: number
          is_correct: boolean
          score: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          question_id?: number
          answer_id?: number
          response_time?: number
          is_correct?: boolean
          score?: number
          created_at?: string
        }
      }
      certificates: {
        Row: {
          id: number
          user_id: string
          track_id: number
          issue_date: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          track_id: number
          issue_date: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          track_id?: number
          issue_date?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 