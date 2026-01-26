-- =============================================
-- МИГРАЦИЯ: Поддержка семейных профилей
-- Версия: 1.0
-- Дата: Январь 2026
-- =============================================
-- 
-- Эта миграция добавляет поддержку:
-- - Родственников (family_members)
-- - Повторных опросов (is_update, symptoms_only)
-- - Привязки анализов к профилям (profile_type, family_member_id)
--
-- =============================================

-- 1. Создаём таблицу family_members если её нет
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

-- 2. Добавляем колонки в survey_responses
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'survey_responses' AND column_name = 'profile_type') THEN
    ALTER TABLE survey_responses ADD COLUMN profile_type TEXT DEFAULT 'self';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'survey_responses' AND column_name = 'family_member_id') THEN
    ALTER TABLE survey_responses ADD COLUMN family_member_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'survey_responses' AND column_name = 'is_update') THEN
    ALTER TABLE survey_responses ADD COLUMN is_update BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'survey_responses' AND column_name = 'symptoms_only') THEN
    ALTER TABLE survey_responses ADD COLUMN symptoms_only BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 3. Добавляем колонки в uploaded_files
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'uploaded_files' AND column_name = 'profile_type') THEN
    ALTER TABLE uploaded_files ADD COLUMN profile_type TEXT DEFAULT 'self';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'uploaded_files' AND column_name = 'family_member_id') THEN
    ALTER TABLE uploaded_files ADD COLUMN family_member_id UUID;
  END IF;
END $$;

-- 4. Добавляем колонки в analysis_results
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_results' AND column_name = 'profile_type') THEN
    ALTER TABLE analysis_results ADD COLUMN profile_type TEXT DEFAULT 'self';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_results' AND column_name = 'family_member_id') THEN
    ALTER TABLE analysis_results ADD COLUMN family_member_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_results' AND column_name = 'analysis_date') THEN
    ALTER TABLE analysis_results ADD COLUMN analysis_date DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- 5. Добавляем индексы
CREATE INDEX IF NOT EXISTS idx_survey_profile ON survey_responses(user_id, profile_type, family_member_id);
CREATE INDEX IF NOT EXISTS idx_files_profile ON uploaded_files(user_id, profile_type, family_member_id);
CREATE INDEX IF NOT EXISTS idx_analysis_profile ON analysis_results(user_id, profile_type, family_member_id);
CREATE INDEX IF NOT EXISTS idx_analysis_date ON analysis_results(analysis_date);

-- 6. RLS политика для family_members
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_family_members" ON family_members;
CREATE POLICY "open_family_members" ON family_members FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- ГОТОВО!
-- =============================================
-- 
-- После выполнения этой миграции:
-- 
-- ✅ Таблица family_members создана
-- ✅ survey_responses поддерживает is_update, symptoms_only
-- ✅ Все таблицы поддерживают profile_type и family_member_id
-- ✅ Индексы созданы для быстрого поиска
--
-- =============================================
