-- =============================================
-- HEALTH CLUB — PRODUCTION RELEASE
-- Версия: 1.0 (для App Store релиза)
-- Дата: Январь 2026
-- =============================================
-- 
-- 🚀 ВЫПОЛНИТЬ ПЕРЕД РЕЛИЗОМ В APP STORE
-- 
-- Этот файл содержит:
-- 1. Все таблицы с правильной схемой
-- 2. Все миграции для существующих данных
-- 3. Индексы (ПОСЛЕ миграций!)
-- 4. Функции (get_or_create_user, update_profile)
-- 5. RLS политики (ОТКРЫТЫЕ — для MVP)
--
-- =============================================

-- =============================================
-- ЧАСТЬ 1: ТАБЛИЦЫ (без индексов!)
-- =============================================

-- 1. PROFILES — Профили пользователей
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  age INTEGER,
  weight_kg INTEGER,
  height_cm INTEGER,
  survey_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. FAMILY_MEMBERS — Профили родственников
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

-- 3. SURVEY_RESPONSES — Ответы опросника
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  profile_type TEXT DEFAULT 'self',
  family_member_id UUID,
  is_update BOOLEAN DEFAULT FALSE,
  symptoms_only BOOLEAN DEFAULT FALSE
);

-- 4. UPLOADED_FILES — Загруженные анализы
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('pdf', 'image', 'other')),
  file_size INTEGER,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  profile_type TEXT DEFAULT 'self',
  family_member_id UUID
);

-- 5. ANALYSIS_RESULTS — Результаты AI-анализа
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'ready', 'error')),
  main_findings JSONB,
  critical_markers JSONB,
  warning_markers JSONB,
  normal_markers JSONB,
  body_systems JSONB,
  priorities JSONB,
  connection_chain JSONB,
  good_news JSONB,
  summary TEXT,
  result_data JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  profile_type TEXT DEFAULT 'self',
  family_member_id UUID,
  analysis_date DATE DEFAULT CURRENT_DATE
);

-- 6. DAILY_REPORTS — Ежедневные отчёты
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  water_ml INTEGER DEFAULT 0,
  sleep_hours NUMERIC(3,1),
  activity_minutes INTEGER DEFAULT 0,
  ai_feedback JSONB DEFAULT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, report_date)
);

-- 7. FASTING_SETTINGS — Настройки голодания
CREATE TABLE IF NOT EXISTS fasting_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mode TEXT DEFAULT '16:8',
  eating_window_start TIME DEFAULT '12:00',
  is_active BOOLEAN DEFAULT TRUE,
  fasting_hours INTEGER DEFAULT 16,
  eating_hours INTEGER DEFAULT 8,
  start_time TIME DEFAULT '20:00',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. FASTING_SESSIONS — Сессии голодания
CREATE TABLE IF NOT EXISTS fasting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mode TEXT DEFAULT '16:8',
  fasting_type TEXT DEFAULT '16:8',
  target_hours INTEGER DEFAULT 16,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'early', 'missed')),
  actual_hours DECIMAL(5,2),
  completion_percent INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. FOOD_LOGS — Дневник питания
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

-- 10. RECIPES — Рецепты
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
-- ЧАСТЬ 2: МИГРАЦИИ (для существующих таблиц)
-- =============================================

-- Миграция profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Миграция fasting_sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fasting_sessions' AND column_name = 'mode') THEN
    ALTER TABLE fasting_sessions ADD COLUMN mode TEXT DEFAULT '16:8';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fasting_sessions' AND column_name = 'fasting_type') THEN
    ALTER TABLE fasting_sessions ADD COLUMN fasting_type TEXT DEFAULT '16:8';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fasting_sessions' AND column_name = 'target_hours') THEN
    ALTER TABLE fasting_sessions ADD COLUMN target_hours INTEGER DEFAULT 16;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fasting_sessions' AND column_name = 'scheduled_end') THEN
    ALTER TABLE fasting_sessions ADD COLUMN scheduled_end TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fasting_sessions' AND column_name = 'status') THEN
    ALTER TABLE fasting_sessions ADD COLUMN status TEXT DEFAULT 'in_progress';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fasting_sessions' AND column_name = 'actual_hours') THEN
    ALTER TABLE fasting_sessions ADD COLUMN actual_hours DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fasting_sessions' AND column_name = 'completion_percent') THEN
    ALTER TABLE fasting_sessions ADD COLUMN completion_percent INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fasting_sessions' AND column_name = 'notes') THEN
    ALTER TABLE fasting_sessions ADD COLUMN notes TEXT;
  END IF;
END $$;

-- ended_at должен быть nullable
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fasting_sessions' AND column_name = 'ended_at' AND is_nullable = 'NO') THEN
    ALTER TABLE fasting_sessions ALTER COLUMN ended_at DROP NOT NULL;
  END IF;
END $$;

-- Миграция fasting_settings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fasting_settings' AND column_name = 'mode') THEN
    ALTER TABLE fasting_settings ADD COLUMN mode TEXT DEFAULT '16:8';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fasting_settings' AND column_name = 'eating_window_start') THEN
    ALTER TABLE fasting_settings ADD COLUMN eating_window_start TIME DEFAULT '12:00';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fasting_settings' AND column_name = 'is_active') THEN
    ALTER TABLE fasting_settings ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Миграция survey_responses
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'survey_responses' AND column_name = 'profile_type') THEN
    ALTER TABLE survey_responses ADD COLUMN profile_type TEXT DEFAULT 'self';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'survey_responses' AND column_name = 'family_member_id') THEN
    ALTER TABLE survey_responses ADD COLUMN family_member_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'survey_responses' AND column_name = 'is_update') THEN
    ALTER TABLE survey_responses ADD COLUMN is_update BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'survey_responses' AND column_name = 'symptoms_only') THEN
    ALTER TABLE survey_responses ADD COLUMN symptoms_only BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Миграция uploaded_files
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'uploaded_files' AND column_name = 'profile_type') THEN
    ALTER TABLE uploaded_files ADD COLUMN profile_type TEXT DEFAULT 'self';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'uploaded_files' AND column_name = 'family_member_id') THEN
    ALTER TABLE uploaded_files ADD COLUMN family_member_id UUID;
  END IF;
END $$;

-- Миграция analysis_results
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'status') THEN
    ALTER TABLE analysis_results ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'main_findings') THEN
    ALTER TABLE analysis_results ADD COLUMN main_findings JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'critical_markers') THEN
    ALTER TABLE analysis_results ADD COLUMN critical_markers JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'warning_markers') THEN
    ALTER TABLE analysis_results ADD COLUMN warning_markers JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'normal_markers') THEN
    ALTER TABLE analysis_results ADD COLUMN normal_markers JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'body_systems') THEN
    ALTER TABLE analysis_results ADD COLUMN body_systems JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'priorities') THEN
    ALTER TABLE analysis_results ADD COLUMN priorities JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'connection_chain') THEN
    ALTER TABLE analysis_results ADD COLUMN connection_chain JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'good_news') THEN
    ALTER TABLE analysis_results ADD COLUMN good_news JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'summary') THEN
    ALTER TABLE analysis_results ADD COLUMN summary TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'profile_type') THEN
    ALTER TABLE analysis_results ADD COLUMN profile_type TEXT DEFAULT 'self';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'family_member_id') THEN
    ALTER TABLE analysis_results ADD COLUMN family_member_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_results' AND column_name = 'analysis_date') THEN
    ALTER TABLE analysis_results ADD COLUMN analysis_date DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- =============================================
-- ЧАСТЬ 3: ИНДЕКСЫ (после всех миграций!)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_user ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_files_user ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_user ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_date ON analysis_results(analysis_date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_user_date ON daily_reports(user_id, report_date);
CREATE INDEX IF NOT EXISTS idx_fasting_settings_user ON fasting_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_user ON fasting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_status ON fasting_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_started ON fasting_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, log_date);

-- =============================================
-- ЧАСТЬ 4: ФУНКЦИИ
-- =============================================

-- Удаляем старую версию функции
DROP FUNCTION IF EXISTS get_or_create_user(TEXT, TEXT);

-- Функция входа/регистрации
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
  SELECT p.id INTO v_user_id FROM profiles p WHERE p.email = LOWER(p_email);
  
  IF v_user_id IS NULL THEN
    INSERT INTO profiles (email, name)
    VALUES (LOWER(p_email), p_name)
    RETURNING profiles.id INTO v_user_id;
  ELSE
    UPDATE profiles SET last_login_at = NOW() WHERE profiles.id = v_user_id;
  END IF;
  
  RETURN QUERY 
  SELECT p.id, p.email, p.name, p.gender, p.age, p.weight_kg, p.height_cm, p.survey_completed, p.onboarding_completed
  FROM profiles p WHERE p.id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция обновления профиля
CREATE OR REPLACE FUNCTION update_profile(
  p_user_id UUID,
  p_name TEXT DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_age INTEGER DEFAULT NULL,
  p_weight_kg INTEGER DEFAULT NULL,
  p_height_cm INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
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
-- ЧАСТЬ 5: RLS ПОЛИТИКИ
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

-- Открытые политики для MVP (TODO: заменить на строгие после релиза)
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
-- ЧАСТЬ 6: ПРОВЕРКА
-- =============================================

SELECT '✅ Миграция завершена!' as status;

-- Выводим количество таблиц
SELECT 'Таблицы:' as info, count(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- =============================================
-- ГОТОВО! 🚀
-- =============================================
-- 
-- После выполнения проверь:
-- 
-- ✅ 1. Storage Buckets созданы:
--       - health-files (Public: ON)
--       - food-photos (Public: ON)
-- 
-- ✅ 2. Edge Functions деплоены:
--       - generate-report
--       - analyze-food
-- 
-- ✅ 3. Env переменные в приложении:
--       - VITE_SUPABASE_URL
--       - VITE_SUPABASE_ANON_KEY
--
-- =============================================
