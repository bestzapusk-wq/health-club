-- =====================================================
-- ПОЛИТИКИ ДЛЯ БАКЕТА health-files (Storage)
-- Выполните в SQL Editor в Supabase Dashboard
-- =====================================================

-- 1. Разрешить загрузку файлов (INSERT)
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'health-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. Разрешить просмотр своих файлов (SELECT)
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'health-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Разрешить удаление своих файлов (DELETE)
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'health-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- АЛЬТЕРНАТИВА: Если нет аутентификации Supabase Auth,
-- используем политику на основе user_id из localStorage
-- =====================================================

-- Разрешить всем загружать в свою папку (по user_id)
-- DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
-- CREATE POLICY "Allow upload to user folder"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'health-files');

-- DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
-- CREATE POLICY "Allow read from user folder"  
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'health-files');

-- DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
-- CREATE POLICY "Allow delete from user folder"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'health-files');

-- =====================================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ uploaded_files
-- =====================================================

-- Включить RLS для таблицы
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Разрешить пользователям вставлять свои записи
CREATE POLICY "Users can insert their own files"
ON uploaded_files FOR INSERT
WITH CHECK (true);

-- Разрешить пользователям читать свои записи
CREATE POLICY "Users can view their own files"
ON uploaded_files FOR SELECT
USING (true);

-- Разрешить пользователям удалять свои записи
CREATE POLICY "Users can delete their own files"
ON uploaded_files FOR DELETE
USING (true);

-- =====================================================
-- СОЗДАНИЕ ТАБЛИЦЫ uploaded_files (если не существует)
-- =====================================================

CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  category TEXT DEFAULT 'analysis',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);

-- =====================================================
-- СОЗДАНИЕ ТАБЛИЦЫ daily_reports (для дневника здоровья)
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  water_ml INTEGER DEFAULT 0,
  activity_minutes INTEGER,
  sleep_hours INTEGER,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, report_date)
);

-- Индекс для быстрого поиска по user_id и дате
CREATE INDEX IF NOT EXISTS idx_daily_reports_user_date ON daily_reports(user_id, report_date DESC);

-- Включить RLS
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Политики для daily_reports
CREATE POLICY "Users can insert their own reports"
ON daily_reports FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own reports"
ON daily_reports FOR SELECT
USING (true);

CREATE POLICY "Users can update their own reports"
ON daily_reports FOR UPDATE
USING (true);

CREATE POLICY "Users can delete their own reports"
ON daily_reports FOR DELETE
USING (true);
