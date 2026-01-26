-- =============================================
-- FIX_STABILITY.sql
-- Быстрый фикс для стабилизации приложения
-- 
-- ВЫПОЛНИ ЭТОТ ФАЙЛ В SUPABASE SQL EDITOR!
-- =============================================

-- =============================================
-- 1. ИСПРАВЛЯЕМ fasting_sessions
-- =============================================

-- Добавляем недостающие колонки
DO $$
BEGIN
  -- mode (КРИТИЧНО! Используется в fastingService.js)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'mode') THEN
    ALTER TABLE fasting_sessions ADD COLUMN mode TEXT DEFAULT '16:8';
    RAISE NOTICE '✅ Добавлена колонка mode';
  END IF;

  -- fasting_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'fasting_type') THEN
    ALTER TABLE fasting_sessions ADD COLUMN fasting_type TEXT DEFAULT '16:8';
    RAISE NOTICE '✅ Добавлена колонка fasting_type';
  END IF;
  
  -- target_hours
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'target_hours') THEN
    ALTER TABLE fasting_sessions ADD COLUMN target_hours INTEGER DEFAULT 16;
    RAISE NOTICE '✅ Добавлена колонка target_hours';
  END IF;
  
  -- scheduled_end
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'scheduled_end') THEN
    ALTER TABLE fasting_sessions ADD COLUMN scheduled_end TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Добавлена колонка scheduled_end';
  END IF;
  
  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'status') THEN
    ALTER TABLE fasting_sessions ADD COLUMN status TEXT DEFAULT 'in_progress';
    RAISE NOTICE '✅ Добавлена колонка status';
  END IF;
  
  -- actual_hours
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'actual_hours') THEN
    ALTER TABLE fasting_sessions ADD COLUMN actual_hours DECIMAL(5,2);
    RAISE NOTICE '✅ Добавлена колонка actual_hours';
  END IF;
  
  -- completion_percent
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'completion_percent') THEN
    ALTER TABLE fasting_sessions ADD COLUMN completion_percent INTEGER;
    RAISE NOTICE '✅ Добавлена колонка completion_percent';
  END IF;
  
  -- notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'notes') THEN
    ALTER TABLE fasting_sessions ADD COLUMN notes TEXT;
    RAISE NOTICE '✅ Добавлена колонка notes';
  END IF;
END $$;

-- Убираем NOT NULL с ended_at (КРИТИЧНО для активных сессий!)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fasting_sessions' 
    AND column_name = 'ended_at' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE fasting_sessions ALTER COLUMN ended_at DROP NOT NULL;
    RAISE NOTICE '✅ ended_at теперь может быть NULL';
  END IF;
END $$;

-- Добавляем индексы если их нет
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_status ON fasting_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_started ON fasting_sessions(started_at DESC);

-- =============================================
-- 2. ИСПРАВЛЯЕМ fasting_settings
-- =============================================

DO $$
BEGIN
  -- mode
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_settings' AND column_name = 'mode') THEN
    ALTER TABLE fasting_settings ADD COLUMN mode TEXT DEFAULT '16:8';
    RAISE NOTICE '✅ fasting_settings: добавлена колонка mode';
  END IF;
  
  -- eating_window_start
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_settings' AND column_name = 'eating_window_start') THEN
    ALTER TABLE fasting_settings ADD COLUMN eating_window_start TIME DEFAULT '12:00';
    RAISE NOTICE '✅ fasting_settings: добавлена колонка eating_window_start';
  END IF;
  
  -- is_active
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_settings' AND column_name = 'is_active') THEN
    ALTER TABLE fasting_settings ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE '✅ fasting_settings: добавлена колонка is_active';
  END IF;
END $$;

-- =============================================
-- 3. ИСПРАВЛЯЕМ analysis_results
-- =============================================

DO $$
BEGIN
  -- main_findings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_results' AND column_name = 'main_findings') THEN
    ALTER TABLE analysis_results ADD COLUMN main_findings JSONB;
    RAISE NOTICE '✅ analysis_results: добавлена колонка main_findings';
  END IF;
  
  -- critical_markers
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_results' AND column_name = 'critical_markers') THEN
    ALTER TABLE analysis_results ADD COLUMN critical_markers JSONB;
    RAISE NOTICE '✅ analysis_results: добавлена колонка critical_markers';
  END IF;
  
  -- warning_markers
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_results' AND column_name = 'warning_markers') THEN
    ALTER TABLE analysis_results ADD COLUMN warning_markers JSONB;
    RAISE NOTICE '✅ analysis_results: добавлена колонка warning_markers';
  END IF;
  
  -- normal_markers
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_results' AND column_name = 'normal_markers') THEN
    ALTER TABLE analysis_results ADD COLUMN normal_markers JSONB;
    RAISE NOTICE '✅ analysis_results: добавлена колонка normal_markers';
  END IF;
  
  -- body_systems
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_results' AND column_name = 'body_systems') THEN
    ALTER TABLE analysis_results ADD COLUMN body_systems JSONB;
    RAISE NOTICE '✅ analysis_results: добавлена колонка body_systems';
  END IF;
  
  -- priorities
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_results' AND column_name = 'priorities') THEN
    ALTER TABLE analysis_results ADD COLUMN priorities JSONB;
    RAISE NOTICE '✅ analysis_results: добавлена колонка priorities';
  END IF;
  
  -- connection_chain
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_results' AND column_name = 'connection_chain') THEN
    ALTER TABLE analysis_results ADD COLUMN connection_chain JSONB;
    RAISE NOTICE '✅ analysis_results: добавлена колонка connection_chain';
  END IF;
  
  -- good_news
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_results' AND column_name = 'good_news') THEN
    ALTER TABLE analysis_results ADD COLUMN good_news JSONB;
    RAISE NOTICE '✅ analysis_results: добавлена колонка good_news';
  END IF;
  
  -- summary
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_results' AND column_name = 'summary') THEN
    ALTER TABLE analysis_results ADD COLUMN summary TEXT;
    RAISE NOTICE '✅ analysis_results: добавлена колонка summary';
  END IF;
END $$;

-- =============================================
-- 4. ИСПРАВЛЯЕМ get_or_create_user
-- =============================================

-- Сначала удаляем старую функцию (иначе нельзя изменить тип возврата)
DROP FUNCTION IF EXISTS get_or_create_user(TEXT, TEXT);

-- Функция должна возвращать TABLE, не UUID
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

-- =============================================
-- 5. ПРОВЕРКА
-- =============================================

-- Выводим текущую схему fasting_sessions
SELECT 'fasting_sessions' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fasting_sessions'
ORDER BY ordinal_position;

-- Выводим текущую схему analysis_results
SELECT 'analysis_results' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'analysis_results'
ORDER BY ordinal_position;

-- =============================================
-- ГОТОВО!
-- =============================================
-- 
-- После выполнения:
-- ✅ fasting_sessions имеет все колонки: mode, fasting_type, 
--    target_hours, scheduled_end, status, actual_hours, completion_percent
-- ✅ ended_at может быть NULL (для активных сессий)
-- ✅ analysis_results имеет колонки для структурированных данных
-- ✅ get_or_create_user возвращает полный профиль
-- ✅ Голодание и разбор анализов будут работать стабильно
--
-- =============================================
