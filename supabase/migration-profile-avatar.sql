-- =============================================
-- Миграция: Аватар и расширение профиля
-- Дата: 2026-01-17
-- =============================================

-- 1. Добавляем колонку avatar_url в profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Добавляем колонку last_name (если нет)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 3. Добавляем колонку first_name (если нет, для совместимости с name)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT;

-- 4. Синхронизируем first_name с name для существующих записей
UPDATE profiles 
SET first_name = name 
WHERE first_name IS NULL AND name IS NOT NULL;

-- =============================================
-- Создание Storage bucket для аватаров
-- =============================================
-- ВАЖНО: Bucket нужно создать через Supabase Dashboard:
-- 1. Перейти в Storage
-- 2. Create new bucket
-- 3. Name: avatars
-- 4. Public: true

-- Альтернативно через SQL (если есть доступ):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;

-- =============================================
-- RLS политики для Storage
-- =============================================

-- Разрешить пользователям загружать в свою папку
-- Политика для INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can upload own avatar'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Разрешить публичное чтение аватаров
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Public avatar access'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public avatar access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Разрешить обновление своего аватара
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update own avatar'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'avatars' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Разрешить удаление своего аватара
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can delete own avatar'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'avatars' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- =============================================
-- Проверка результатов
-- =============================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name IN ('avatar_url', 'last_name', 'first_name');

-- =============================================
-- ИНСТРУКЦИЯ ПО ПРИМЕНЕНИЮ
-- =============================================
-- 
-- 1. Выполнить этот SQL в Supabase SQL Editor
-- 
-- 2. Создать bucket 'avatars' в Storage:
--    - Dashboard → Storage → New bucket
--    - Name: avatars
--    - Public bucket: ВКЛ
-- 
-- 3. Если bucket уже есть, убедиться что он public
-- 
-- =============================================
