-- =============================================
-- SQL скрипт для проверки и настройки таблиц
-- Выполните в Supabase SQL Editor
-- =============================================

-- 1. PROFILES (профили пользователей)
-- Проверяем существование и добавляем недостающие колонки
DO $$ 
BEGIN
  -- Добавляем колонку survey_completed если её нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'survey_completed') THEN
    ALTER TABLE profiles ADD COLUMN survey_completed boolean DEFAULT false;
  END IF;
  
  -- Добавляем колонку survey_completed_at если её нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'survey_completed_at') THEN
    ALTER TABLE profiles ADD COLUMN survey_completed_at timestamptz;
  END IF;
END $$;

-- 2. SURVEY_RESPONSES (ответы опросника)
CREATE TABLE IF NOT EXISTS survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL,  -- JSON со всеми ответами {question_id: answer}
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Индекс для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);

-- RLS политики
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own survey responses" ON survey_responses;
CREATE POLICY "Users can view own survey responses" ON survey_responses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own survey responses" ON survey_responses;
CREATE POLICY "Users can insert own survey responses" ON survey_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 3. UPLOADED_FILES (загруженные файлы анализов)
CREATE TABLE IF NOT EXISTS uploaded_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'image', 'other')),
  file_size integer NOT NULL,
  file_path text NOT NULL,  -- путь в Storage bucket
  uploaded_at timestamptz DEFAULT now()
);

-- Индекс
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);

-- RLS
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own files" ON uploaded_files;
CREATE POLICY "Users can view own files" ON uploaded_files
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own files" ON uploaded_files;
CREATE POLICY "Users can insert own files" ON uploaded_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own files" ON uploaded_files;
CREATE POLICY "Users can delete own files" ON uploaded_files
  FOR DELETE USING (auth.uid() = user_id);


-- 4. ANALYSIS_RESULTS (результаты AI-анализа)
CREATE TABLE IF NOT EXISTS analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  result_data jsonb,  -- JSON с результатом от Claude
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  
  -- Один результат на пользователя (upsert)
  CONSTRAINT analysis_results_user_id_key UNIQUE (user_id)
);

-- Индекс
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_status ON analysis_results(status);

-- RLS
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analysis" ON analysis_results;
CREATE POLICY "Users can view own analysis" ON analysis_results
  FOR SELECT USING (auth.uid() = user_id);

-- Сервисная роль может всё (для Edge Function)
DROP POLICY IF EXISTS "Service role full access" ON analysis_results;
CREATE POLICY "Service role full access" ON analysis_results
  FOR ALL USING (auth.role() = 'service_role');


-- 5. STORAGE BUCKET (для файлов)
-- Выполнить в разделе Storage -> Policies
-- Или через SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('health-files', 'health-files', true)
ON CONFLICT (id) DO NOTHING;

-- Политика для загрузки файлов
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'health-files' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Политика для чтения файлов (публичный доступ для AI)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'health-files');

-- Политика для удаления
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'health-files' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- =============================================
-- 6. FASTING_SETTINGS (настройки интервального голодания)
-- =============================================
CREATE TABLE IF NOT EXISTS fasting_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  mode text NOT NULL DEFAULT '16:8',
  eating_window_start time NOT NULL DEFAULT '12:00',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Индекс для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS idx_fasting_settings_user_id ON fasting_settings(user_id);

-- RLS
ALTER TABLE fasting_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own fasting settings" ON fasting_settings;
CREATE POLICY "Users can view own fasting settings" ON fasting_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own fasting settings" ON fasting_settings;
CREATE POLICY "Users can insert own fasting settings" ON fasting_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own fasting settings" ON fasting_settings;
CREATE POLICY "Users can update own fasting settings" ON fasting_settings
  FOR UPDATE USING (auth.uid() = user_id);


-- =============================================
-- 7. FASTING_SESSIONS (история сессий голодания)
-- =============================================
CREATE TABLE IF NOT EXISTS fasting_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  planned_hours integer NOT NULL,
  actual_hours decimal(4,2) NOT NULL,
  completed_fully boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_user_id ON fasting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_started_at ON fasting_sessions(user_id, started_at DESC);

-- RLS
ALTER TABLE fasting_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own fasting sessions" ON fasting_sessions;
CREATE POLICY "Users can view own fasting sessions" ON fasting_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own fasting sessions" ON fasting_sessions;
CREATE POLICY "Users can insert own fasting sessions" ON fasting_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own fasting sessions" ON fasting_sessions;
CREATE POLICY "Users can update own fasting sessions" ON fasting_sessions
  FOR UPDATE USING (auth.uid() = user_id);


-- =============================================
-- ПРОВЕРКА: Выполните эти запросы для диагностики
-- =============================================

-- Проверить структуру таблиц:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'survey_responses';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'uploaded_files';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'analysis_results';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'fasting_settings';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'fasting_sessions';

-- Проверить данные:
-- SELECT * FROM survey_responses LIMIT 5;
-- SELECT * FROM uploaded_files LIMIT 5;
-- SELECT * FROM analysis_results LIMIT 5;
-- SELECT * FROM fasting_settings LIMIT 5;
-- SELECT * FROM fasting_sessions LIMIT 5;
