-- =====================================================
-- LEARNING ACADEMY (Клуб здоровья Alimi Health)
-- Выполнить в Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. ТАБЛИЦА: Прогресс прохождения уроков
-- =====================================================
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,  -- ID урока из learningModules.js (например 'intro-1', 'nutrition-2')
  status TEXT DEFAULT 'not_started',  -- 'not_started', 'in_progress', 'completed'
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Уникальный прогресс: один пользователь - один урок
  UNIQUE(user_id, lesson_id)
);

-- Индекс для быстрой выборки прогресса пользователя
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user 
  ON user_lesson_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson 
  ON user_lesson_progress(lesson_id);

-- =====================================================
-- 2. RLS ПОЛИТИКИ для user_lesson_progress
-- =====================================================
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть только свой прогресс
DROP POLICY IF EXISTS "Users can view own progress" ON user_lesson_progress;
CREATE POLICY "Users can view own progress" ON user_lesson_progress
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- Пользователи могут создавать свой прогресс
DROP POLICY IF EXISTS "Users can insert own progress" ON user_lesson_progress;
CREATE POLICY "Users can insert own progress" ON user_lesson_progress
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять свой прогресс
DROP POLICY IF EXISTS "Users can update own progress" ON user_lesson_progress;
CREATE POLICY "Users can update own progress" ON user_lesson_progress
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. ТАБЛИЦА: Файлы материалов (для скачиваемых PDF)
-- =====================================================
CREATE TABLE IF NOT EXISTS material_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id TEXT NOT NULL,  -- ID материала из materials.js
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,  -- 'pdf', 'doc', 'external_link'
  file_path TEXT,           -- путь в Supabase Storage
  external_url TEXT,        -- внешняя ссылка (Google Drive и т.д.)
  display_name TEXT NOT NULL,
  description TEXT,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS для material_files
ALTER TABLE material_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view material files" ON material_files;
CREATE POLICY "Users can view material files" ON material_files
  FOR SELECT TO authenticated USING (true);

-- Индекс для быстрого поиска по material_id
CREATE INDEX IF NOT EXISTS idx_material_files_material_id 
  ON material_files(material_id);

-- =====================================================
-- 4. STORAGE BUCKET: materials (для PDF файлов)
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

-- Политика чтения для authenticated пользователей
DROP POLICY IF EXISTS "Authenticated users can read materials" ON storage.objects;
CREATE POLICY "Authenticated users can read materials" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'materials');

-- Политика скачивания
DROP POLICY IF EXISTS "Authenticated users can download materials" ON storage.objects;
CREATE POLICY "Authenticated users can download materials" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'materials');

-- =====================================================
-- 5. ФУНКЦИЯ: Обновление updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для user_lesson_progress
DROP TRIGGER IF EXISTS update_user_lesson_progress_updated_at ON user_lesson_progress;
CREATE TRIGGER update_user_lesson_progress_updated_at
  BEFORE UPDATE ON user_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. ПРОВЕРКА: Убедиться что profiles существует
-- =====================================================
-- Если таблицы profiles нет, создаём минимальную версию
-- (обычно она уже есть в проекте)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT,
      email TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own profile" ON profiles
      FOR SELECT TO authenticated USING (auth.uid() = id);
      
    CREATE POLICY "Users can update own profile" ON profiles
      FOR UPDATE TO authenticated USING (auth.uid() = id);
  END IF;
END $$;

-- =====================================================
-- ГОТОВО! 
-- =====================================================
-- После выполнения этого скрипта:
-- 1. Загрузите PDF файлы в Storage bucket "materials":
--    - materials/liver-detox/metodichka.pdf
--    - materials/gallbladder/metodichka.pdf
-- 2. Скачать PDF можно отсюда:
--    - Детокс печени: https://drive.google.com/drive/folders/1dcD03tjdhZKbVmYYDgj0_ual4YeEy2LF
--    - Жёлчный пузырь: https://drive.google.com/drive/folders/1m1_BOHRNU8POVdZVAIycxU-9OTCPHMCX
-- =====================================================
