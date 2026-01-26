-- =============================================
-- МИГРАЦИЯ: Профили родственников и история анализов
-- Версия: 1.0
-- Дата: Январь 2026
-- =============================================

-- =============================================
-- 1. FAMILY_MEMBERS — Профили родственников
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

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);

-- RLS политики
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own family members" ON family_members;
DROP POLICY IF EXISTS "Users can insert own family members" ON family_members;
DROP POLICY IF EXISTS "Users can update own family members" ON family_members;
DROP POLICY IF EXISTS "Users can delete own family members" ON family_members;
DROP POLICY IF EXISTS "open_family_members" ON family_members;

-- Открытая политика для тестирования (заменить на строгие в продакшене)
CREATE POLICY "open_family_members" ON family_members 
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 2. ОБНОВЛЕНИЕ ТАБЛИЦ для поддержки профилей и истории
-- =============================================

-- Удаляем UNIQUE constraint с user_id в analysis_results (если есть)
-- чтобы один пользователь мог иметь несколько разборов
ALTER TABLE analysis_results DROP CONSTRAINT IF EXISTS analysis_results_user_id_key;

-- Добавляем колонки для профилей в survey_responses
ALTER TABLE survey_responses 
  ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'self',
  ADD COLUMN IF NOT EXISTS family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE;

-- Добавляем колонки для профилей в uploaded_files
ALTER TABLE uploaded_files
  ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'self',
  ADD COLUMN IF NOT EXISTS family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE;

-- Добавляем колонки для профилей и истории в analysis_results
ALTER TABLE analysis_results
  ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'self',
  ADD COLUMN IF NOT EXISTS family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS analysis_date DATE DEFAULT CURRENT_DATE;

-- Индексы для новых колонок
CREATE INDEX IF NOT EXISTS idx_survey_profile ON survey_responses(user_id, profile_type, family_member_id);
CREATE INDEX IF NOT EXISTS idx_files_profile ON uploaded_files(user_id, profile_type, family_member_id);
CREATE INDEX IF NOT EXISTS idx_analysis_profile ON analysis_results(user_id, profile_type, family_member_id);
CREATE INDEX IF NOT EXISTS idx_analysis_date ON analysis_results(analysis_date);

-- =============================================
-- ГОТОВО!
-- =============================================
--
-- Что изменилось:
--
-- ✅ Создана таблица family_members для хранения родственников
-- ✅ Удалён UNIQUE constraint с analysis_results.user_id (теперь можно хранить историю)
-- ✅ Добавлены profile_type и family_member_id во все связанные таблицы
-- ✅ Добавлена колонка analysis_date для даты анализов
--
-- =============================================
