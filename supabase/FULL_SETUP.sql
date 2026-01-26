-- =============================================
-- HEALTH CLUB - ПОЛНАЯ НАСТРОЙКА SUPABASE
-- Версия: 2.0 (все таблицы + все функции)
-- Дата: Январь 2026
-- =============================================
-- 
-- STORAGE BUCKETS (создать вручную в Dashboard):
-- ┌─────────────────┬────────────────────────────┬────────┐
-- │ Bucket          │ Назначение                 │ Public │
-- ├─────────────────┼────────────────────────────┼────────┤
-- │ health-files    │ Загруженные анализы        │ ON     │
-- │ analysis-files  │ Повторные загрузки анализов│ ON     │
-- │ food-photos     │ Фото еды для AI анализа    │ ON     │
-- └─────────────────┴────────────────────────────┴────────┘
--
-- =============================================

-- ОЧИСТКА (опционально — раскомментировать если нужно пересоздать)
-- DROP TABLE IF EXISTS food_logs CASCADE;
-- DROP TABLE IF EXISTS fasting_sessions CASCADE;
-- DROP TABLE IF EXISTS fasting_settings CASCADE;
-- DROP TABLE IF EXISTS daily_reports CASCADE;
-- DROP TABLE IF EXISTS analysis_results CASCADE;
-- DROP TABLE IF EXISTS uploaded_files CASCADE;
-- DROP TABLE IF EXISTS survey_responses CASCADE;
-- DROP TABLE IF EXISTS recipes CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- =============================================
-- 1. PROFILES — Профили пользователей
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  age INTEGER,
  weight_kg INTEGER,
  height_cm INTEGER,
  
  -- Статусы прогресса
  survey_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =============================================
-- 2. SURVEY_RESPONSES — Ответы опросника
-- =============================================
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Поддержка профилей родственников
  profile_type TEXT DEFAULT 'self',
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  -- Поддержка повторных опросов
  is_update BOOLEAN DEFAULT FALSE,
  symptoms_only BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_survey_user ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_profile ON survey_responses(user_id, profile_type, family_member_id);

-- Добавить колонки если таблица уже существует
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'survey_responses' AND column_name = 'is_update') THEN
    ALTER TABLE survey_responses ADD COLUMN is_update BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'survey_responses' AND column_name = 'symptoms_only') THEN
    ALTER TABLE survey_responses ADD COLUMN symptoms_only BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- =============================================
-- 2.5 FAMILY_MEMBERS — Профили родственников
-- =============================================
CREATE TABLE IF NOT EXISTS family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')),
  age INTEGER,
  relation TEXT CHECK (relation IN ('spouse', 'child', 'parent', 'sibling', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);

-- =============================================
-- 3. UPLOADED_FILES — Загруженные анализы
-- =============================================
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('pdf', 'image', 'other')),
  file_size INTEGER,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Поддержка профилей родственников
  profile_type TEXT DEFAULT 'self',
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_files_user ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_profile ON uploaded_files(user_id, profile_type, family_member_id);

-- =============================================
-- 4. ANALYSIS_RESULTS — Результаты AI-анализа
-- =============================================
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'ready', 'error')),
  
  -- Структурированные данные (для удобства запросов)
  main_findings JSONB,
  critical_markers JSONB,
  warning_markers JSONB,
  normal_markers JSONB,
  body_systems JSONB,
  priorities JSONB,
  connection_chain JSONB,
  good_news JSONB,
  summary TEXT,
  
  -- Полный ответ AI (для backup)
  result_data JSONB,
  
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Поддержка профилей родственников и истории
  profile_type TEXT DEFAULT 'self',
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  analysis_date DATE DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_analysis_user ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_profile ON analysis_results(user_id, profile_type, family_member_id);
CREATE INDEX IF NOT EXISTS idx_analysis_date ON analysis_results(analysis_date);

-- =============================================
-- 5. DAILY_REPORTS — Ежедневные отчёты (вода, сон, активность)
-- =============================================
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  water_ml INTEGER DEFAULT 0,
  sleep_hours NUMERIC(3,1),
  activity_minutes INTEGER DEFAULT 0,
  
  -- AI-фидбек
  ai_feedback JSONB DEFAULT NULL,
  
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_user_date ON daily_reports(user_id, report_date);

-- =============================================
-- 6. FASTING_SETTINGS — Настройки интервального голодания
-- =============================================
CREATE TABLE IF NOT EXISTS fasting_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Основные настройки (используются приложением)
  mode TEXT DEFAULT '16:8',
  eating_window_start TIME DEFAULT '12:00',
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Дополнительные поля
  fasting_hours INTEGER DEFAULT 16,
  eating_hours INTEGER DEFAULT 8,
  start_time TIME DEFAULT '20:00',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fasting_settings_user ON fasting_settings(user_id);

-- =============================================
-- 7. FASTING_SESSIONS — Сессии голодания
-- =============================================
CREATE TABLE IF NOT EXISTS fasting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Настройки сессии
  mode TEXT DEFAULT '16:8',
  fasting_type TEXT DEFAULT '16:8',
  target_hours INTEGER DEFAULT 16,
  
  -- Время
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,  -- NULL для активных сессий
  scheduled_end TIMESTAMP WITH TIME ZONE,
  
  -- Результат
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'early', 'missed')),
  actual_hours DECIMAL(5,2),
  completion_percent INTEGER,
  
  -- Для обратной совместимости
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fasting_sessions_user ON fasting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_status ON fasting_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_started ON fasting_sessions(started_at DESC);

-- =============================================
-- 8. FOOD_LOGS — Дневник питания
-- =============================================
CREATE TABLE IF NOT EXISTS food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  
  description TEXT,
  calories INTEGER,
  photo_url TEXT,
  ai_analysis JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, log_date);

-- =============================================
-- 9. RECIPES — Рецепты (общие для всех)
-- =============================================
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  meal TEXT CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snack')),
  
  time_minutes INTEGER,
  calories INTEGER,
  
  tags TEXT[],
  ingredients JSONB,
  steps JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Открытые политики для тестирования (потом заменить на строгие)
DROP POLICY IF EXISTS "open_profiles" ON profiles;
DROP POLICY IF EXISTS "open_survey" ON survey_responses;
DROP POLICY IF EXISTS "open_files" ON uploaded_files;
DROP POLICY IF EXISTS "open_analysis" ON analysis_results;
DROP POLICY IF EXISTS "open_daily" ON daily_reports;
DROP POLICY IF EXISTS "open_fasting_settings" ON fasting_settings;
DROP POLICY IF EXISTS "open_fasting_sessions" ON fasting_sessions;
DROP POLICY IF EXISTS "open_food_logs" ON food_logs;
DROP POLICY IF EXISTS "open_recipes" ON recipes;
DROP POLICY IF EXISTS "open_family_members" ON family_members;

CREATE POLICY "open_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_survey" ON survey_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_files" ON uploaded_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_analysis" ON analysis_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_daily" ON daily_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_fasting_settings" ON fasting_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_fasting_sessions" ON fasting_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_food_logs" ON food_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_recipes" ON recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_family_members" ON family_members FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- ФУНКЦИИ
-- =============================================

-- Получить или создать пользователя по email
-- ВАЖНО: Возвращает TABLE чтобы RegisterPage.jsx мог получить все поля профиля
DROP FUNCTION IF EXISTS get_or_create_user(TEXT, TEXT);
CREATE OR REPLACE FUNCTION get_or_create_user(p_email TEXT, p_name TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  gender TEXT,
  age INTEGER,
  weight_kg INTEGER,
  height_cm INTEGER,
  survey_completed BOOLEAN,
  onboarding_completed BOOLEAN
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Ищем пользователя
  SELECT p.id INTO v_user_id FROM profiles p WHERE p.email = LOWER(p_email);
  
  -- Если не найден — создаём
  IF v_user_id IS NULL THEN
    INSERT INTO profiles (email, name)
    VALUES (LOWER(p_email), p_name)
    RETURNING profiles.id INTO v_user_id;
  ELSE
    -- Обновляем время входа
    UPDATE profiles SET last_login_at = NOW() WHERE profiles.id = v_user_id;
  END IF;
  
  -- Возвращаем полный профиль
  RETURN QUERY 
  SELECT 
    p.id,
    p.email,
    p.name,
    p.gender,
    p.age,
    p.weight_kg,
    p.height_cm,
    p.survey_completed,
    p.onboarding_completed
  FROM profiles p WHERE p.id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновить профиль пользователя
CREATE OR REPLACE FUNCTION update_profile(
  p_user_id UUID,
  p_name TEXT DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_age INTEGER DEFAULT NULL,
  p_weight_kg INTEGER DEFAULT NULL,
  p_height_cm INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles SET
    name = COALESCE(p_name, name),
    gender = COALESCE(p_gender, gender),
    age = COALESCE(p_age, age),
    weight_kg = COALESCE(p_weight_kg, weight_kg),
    height_cm = COALESCE(p_height_cm, height_cm),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- МИГРАЦИИ (для существующих таблиц)
-- =============================================

-- Миграция fasting_sessions (добавляем недостающие колонки)
DO $$
BEGIN
  -- mode
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'mode') THEN
    ALTER TABLE fasting_sessions ADD COLUMN mode TEXT DEFAULT '16:8';
  END IF;
  
  -- fasting_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'fasting_type') THEN
    ALTER TABLE fasting_sessions ADD COLUMN fasting_type TEXT DEFAULT '16:8';
  END IF;
  
  -- scheduled_end
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'scheduled_end') THEN
    ALTER TABLE fasting_sessions ADD COLUMN scheduled_end TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'status') THEN
    ALTER TABLE fasting_sessions ADD COLUMN status TEXT DEFAULT 'in_progress';
  END IF;
  
  -- actual_hours
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'actual_hours') THEN
    ALTER TABLE fasting_sessions ADD COLUMN actual_hours DECIMAL(5,2);
  END IF;
  
  -- completion_percent
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'completion_percent') THEN
    ALTER TABLE fasting_sessions ADD COLUMN completion_percent INTEGER;
  END IF;
  
  -- notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'notes') THEN
    ALTER TABLE fasting_sessions ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Убираем NOT NULL с ended_at если есть (для активных сессий)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fasting_sessions' 
    AND column_name = 'ended_at' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE fasting_sessions ALTER COLUMN ended_at DROP NOT NULL;
  END IF;
END $$;

-- Добавить колонки для family профилей если их нет
DO $$
BEGIN
  -- survey_responses
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'survey_responses' AND column_name = 'profile_type') THEN
    ALTER TABLE survey_responses ADD COLUMN profile_type TEXT DEFAULT 'self';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'survey_responses' AND column_name = 'family_member_id') THEN
    ALTER TABLE survey_responses ADD COLUMN family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE;
  END IF;
  
  -- uploaded_files
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'uploaded_files' AND column_name = 'profile_type') THEN
    ALTER TABLE uploaded_files ADD COLUMN profile_type TEXT DEFAULT 'self';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'uploaded_files' AND column_name = 'family_member_id') THEN
    ALTER TABLE uploaded_files ADD COLUMN family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE;
  END IF;
  
  -- analysis_results
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_results' AND column_name = 'profile_type') THEN
    ALTER TABLE analysis_results ADD COLUMN profile_type TEXT DEFAULT 'self';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_results' AND column_name = 'family_member_id') THEN
    ALTER TABLE analysis_results ADD COLUMN family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_results' AND column_name = 'analysis_date') THEN
    ALTER TABLE analysis_results ADD COLUMN analysis_date DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- =============================================
-- ГОТОВО!
-- =============================================
-- 
-- Чек-лист после выполнения:
-- 
-- ✅ 1. Выполнить этот SQL в Supabase Dashboard → SQL Editor
-- 
-- ✅ 2. Создать Storage Buckets (Dashboard → Storage → New Bucket):
--       - health-files (Public: ON) — основной для анализов
--       - food-photos (Public: ON) — фото еды для AI
-- 
-- ✅ 3. Настроить политики для Storage:
--       Dashboard → Storage → health-files → Policies → New Policy
--       - SELECT: true (для всех)
--       - INSERT: true (для всех)  
--       - UPDATE: true (для всех)
--       - DELETE: true (для всех)
-- 
-- ✅ 4. Проверить .env файл:
--       VITE_SUPABASE_URL=https://xxx.supabase.co
--       VITE_SUPABASE_ANON_KEY=xxx
-- 
-- ✅ 5. Тестировать: http://localhost:5173/register
--
-- =============================================
