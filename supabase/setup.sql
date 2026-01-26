-- =============================================
-- HEALTH CLUB - ПОЛНАЯ НАСТРОЙКА SUPABASE
-- Запустить в SQL Editor в Supabase Dashboard
-- =============================================

-- 1. ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ (profiles)
-- =============================================
DROP TABLE IF EXISTS food_logs CASCADE;
DROP TABLE IF EXISTS daily_habits CASCADE;
DROP TABLE IF EXISTS analysis_results CASCADE;
DROP TABLE IF EXISTS uploaded_files CASCADE;
DROP TABLE IF EXISTS survey_responses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
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

-- Индекс для быстрого поиска по email
CREATE INDEX idx_profiles_email ON profiles(email);

-- 2. ОТВЕТЫ ОПРОСНИКА
-- =============================================
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_survey_user ON survey_responses(user_id);

-- 3. ЗАГРУЖЕННЫЕ ФАЙЛЫ (анализы)
-- =============================================
CREATE TABLE uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('pdf', 'image', 'other')),
  file_size INTEGER,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_files_user ON uploaded_files(user_id);

-- 4. РЕЗУЛЬТАТЫ AI-АНАЛИЗА
-- =============================================
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  result_data JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analysis_user ON analysis_results(user_id);

-- 5. ЕЖЕДНЕВНЫЕ ПРИВЫЧКИ (вода, сон, активность)
-- =============================================
CREATE TABLE daily_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  water_ml INTEGER DEFAULT 0,
  sleep_hours NUMERIC(3,1),
  activity_minutes INTEGER DEFAULT 0,
  
  vitamins_taken JSONB DEFAULT '[]',
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

CREATE INDEX idx_habits_user_date ON daily_habits(user_id, date);

-- 6. ДНЕВНИК ПИТАНИЯ
-- =============================================
CREATE TABLE food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  
  description TEXT,
  calories INTEGER,
  photo_url TEXT,
  ai_analysis JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_food_user_date ON food_logs(user_id, date);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Включаем RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

-- Политики: пользователь видит только свои данные
-- Для profiles — доступ по email (без auth)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (true);

-- Для остальных таблиц — доступ по user_id
CREATE POLICY "Users can view own surveys" ON survey_responses
  FOR ALL USING (true);

CREATE POLICY "Users can manage own files" ON uploaded_files
  FOR ALL USING (true);

CREATE POLICY "Users can view own analysis" ON analysis_results
  FOR ALL USING (true);

CREATE POLICY "Users can manage own habits" ON daily_habits
  FOR ALL USING (true);

CREATE POLICY "Users can manage own food logs" ON food_logs
  FOR ALL USING (true);

-- =============================================
-- STORAGE BUCKET
-- =============================================
-- Создайте bucket "health-files" вручную в Supabase Dashboard:
-- Storage → New Bucket → Name: "health-files" → Public: OFF

-- Политика для Storage (создайте в Dashboard → Storage → Policies):
-- INSERT: true (anyone can upload)
-- SELECT: true (anyone can download)
-- DELETE: true (anyone can delete)

-- =============================================
-- ФУНКЦИИ
-- =============================================

-- Функция для получения или создания пользователя по email
CREATE OR REPLACE FUNCTION get_or_create_user(p_email TEXT, p_name TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Пытаемся найти пользователя
  SELECT id INTO v_user_id FROM profiles WHERE email = LOWER(p_email);
  
  -- Если не найден — создаём
  IF v_user_id IS NULL THEN
    INSERT INTO profiles (email, name)
    VALUES (LOWER(p_email), p_name)
    RETURNING id INTO v_user_id;
  ELSE
    -- Обновляем last_login
    UPDATE profiles SET last_login_at = NOW() WHERE id = v_user_id;
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для обновления профиля
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
-- ГОТОВО!
-- =============================================
-- После выполнения этого скрипта:
-- 1. Создайте Storage bucket "health-files" (публичный)
-- 2. Проверьте что VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env
