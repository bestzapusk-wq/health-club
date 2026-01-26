-- =============================================
-- МИГРАЦИЯ: Обновление fasting_settings
-- Версия: 1.0
-- Дата: Январь 2026
-- =============================================
-- 
-- Эта миграция обновляет таблицу fasting_settings:
-- - Добавляет колонку mode (для хранения "16:8", "14:10" и т.д.)
-- - Добавляет колонку eating_window_start (время начала окна еды)
-- - Добавляет колонку is_active (активен ли режим)
--
-- =============================================

-- 1. Создаём таблицу если её нет (с новой структурой)
CREATE TABLE IF NOT EXISTS fasting_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Новые поля (которые использует приложение)
  mode TEXT DEFAULT '16:8',
  eating_window_start TIME DEFAULT '12:00',
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Старые поля (для обратной совместимости)
  fasting_hours INTEGER DEFAULT 16,
  eating_hours INTEGER DEFAULT 8,
  start_time TIME DEFAULT '20:00',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Добавляем недостающие колонки если таблица уже существует
DO $$
BEGIN
  -- mode
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_settings' AND column_name = 'mode') THEN
    ALTER TABLE fasting_settings ADD COLUMN mode TEXT DEFAULT '16:8';
  END IF;
  
  -- eating_window_start
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_settings' AND column_name = 'eating_window_start') THEN
    ALTER TABLE fasting_settings ADD COLUMN eating_window_start TIME DEFAULT '12:00';
  END IF;
  
  -- is_active
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_settings' AND column_name = 'is_active') THEN
    ALTER TABLE fasting_settings ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- 3. Создаём индекс
CREATE INDEX IF NOT EXISTS idx_fasting_settings_user ON fasting_settings(user_id);

-- 4. RLS политика
ALTER TABLE fasting_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_fasting_settings" ON fasting_settings;
CREATE POLICY "open_fasting_settings" ON fasting_settings FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 5. Обновляем таблицу fasting_sessions
-- =============================================

-- Создаём таблицу если её нет (с полной структурой)
CREATE TABLE IF NOT EXISTS fasting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Настройки сессии
  fasting_type TEXT NOT NULL DEFAULT '16:8',
  target_hours INTEGER NOT NULL DEFAULT 16,
  
  -- Время
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  
  -- Результат
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'early', 'missed')),
  actual_hours DECIMAL(5,2),
  completion_percent INTEGER,
  
  -- Метаданные
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Добавляем недостающие колонки
DO $$
BEGIN
  -- mode (используется в fastingService.js)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'mode') THEN
    ALTER TABLE fasting_sessions ADD COLUMN mode TEXT DEFAULT '16:8';
  END IF;

  -- fasting_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'fasting_type') THEN
    ALTER TABLE fasting_sessions ADD COLUMN fasting_type TEXT DEFAULT '16:8';
  END IF;
  
  -- target_hours (без NOT NULL чтобы не ломать существующие записи)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'target_hours') THEN
    ALTER TABLE fasting_sessions ADD COLUMN target_hours INTEGER DEFAULT 16;
  END IF;
  
  -- scheduled_end
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'scheduled_end') THEN
    ALTER TABLE fasting_sessions ADD COLUMN scheduled_end TIMESTAMP WITH TIME ZONE;
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
  
  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fasting_sessions' AND column_name = 'status') THEN
    ALTER TABLE fasting_sessions ADD COLUMN status TEXT DEFAULT 'in_progress';
  END IF;
END $$;

-- Убираем NOT NULL с ended_at (должен быть NULL для активных сессий)
DO $$
BEGIN
  -- Проверяем есть ли NOT NULL constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fasting_sessions' 
    AND column_name = 'ended_at' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE fasting_sessions ALTER COLUMN ended_at DROP NOT NULL;
  END IF;
END $$;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_user ON fasting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_started_at ON fasting_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_status ON fasting_sessions(user_id, status);

-- RLS
ALTER TABLE fasting_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_fasting_sessions" ON fasting_sessions;
CREATE POLICY "open_fasting_sessions" ON fasting_sessions FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- ГОТОВО!
-- =============================================
-- 
-- После выполнения этой миграции:
-- 
-- ✅ Таблица fasting_settings обновлена
-- ✅ Колонки mode, eating_window_start, is_active добавлены
-- ✅ Таблица fasting_sessions обновлена с новыми полями
-- ✅ Настройки и сессии голодания будут сохраняться корректно
--
-- =============================================
