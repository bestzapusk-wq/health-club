import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Типы для базы данных (будут дополняться)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          telegram_id: string | null
          name: string | null
          email: string | null
          gender: 'male' | 'female' | null
          birth_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          telegram_id?: string | null
          name?: string | null
          email?: string | null
          gender?: 'male' | 'female' | null
          birth_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          telegram_id?: string | null
          name?: string | null
          email?: string | null
          gender?: 'male' | 'female' | null
          birth_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      survey_responses: {
        Row: {
          id: string
          user_id: string
          answers: Record<string, unknown>  // JSON объект со всеми ответами
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          answers: Record<string, unknown>
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          answers?: Record<string, unknown>
          completed_at?: string
          created_at?: string
        }
      }
      daily_reports: {
        Row: {
          id: string
          user_id: string
          date: string
          water_ml: number
          activity: string | null
          sleep_quality: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          water_ml?: number
          activity?: string | null
          sleep_quality?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          water_ml?: number
          activity?: string | null
          sleep_quality?: string | null
          created_at?: string
        }
      }
      vitamins: {
        Row: {
          id: string
          user_id: string
          name: string
          schedule: string
          reminder_enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          schedule: string
          reminder_enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          schedule?: string
          reminder_enabled?: boolean
          created_at?: string
        }
      }
      vitamin_logs: {
        Row: {
          id: string
          vitamin_id: string
          user_id: string
          taken_at: string
        }
        Insert: {
          id?: string
          vitamin_id: string
          user_id: string
          taken_at?: string
        }
        Update: {
          id?: string
          vitamin_id?: string
          user_id?: string
          taken_at?: string
        }
      }
      lab_results: {
        Row: {
          id: string
          user_id: string
          marker_name: string
          value: number
          unit: string
          reference_min: number | null
          reference_max: number | null
          status: 'normal' | 'low' | 'high' | 'critical'
          tested_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          marker_name: string
          value: number
          unit: string
          reference_min?: number | null
          reference_max?: number | null
          status: 'normal' | 'low' | 'high' | 'critical'
          tested_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          marker_name?: string
          value?: number
          unit?: string
          reference_min?: number | null
          reference_max?: number | null
          status?: 'normal' | 'low' | 'high' | 'critical'
          tested_at?: string
          created_at?: string
        }
      }
      seminar_registrations: {
        Row: {
          id: string
          user_id: string
          seminar_id: string
          registered_at: string
        }
        Insert: {
          id?: string
          user_id: string
          seminar_id: string
          registered_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          seminar_id?: string
          registered_at?: string
        }
      }
      uploaded_files: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_type: 'pdf' | 'image' | 'other'
          file_size: number
          file_path: string  // путь в Storage bucket
          uploaded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_type: 'pdf' | 'image' | 'other'
          file_size: number
          file_path: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_type?: 'pdf' | 'image' | 'other'
          file_size?: number
          file_path?: string
          uploaded_at?: string
        }
      }
      analysis_results: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'processing' | 'completed' | 'error'
          result_data: Record<string, unknown> | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'processing' | 'completed' | 'error'
          result_data?: Record<string, unknown> | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'processing' | 'completed' | 'error'
          result_data?: Record<string, unknown> | null
          created_at?: string
          completed_at?: string | null
        }
      }
    }
  }
}
