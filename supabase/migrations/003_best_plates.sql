-- ============================================================
-- МИГРАЦИЯ: Лучшие тарелки недели
-- Дата: 2026-01-27
-- Описание: Таблица для хранения лучших тарелок участников клуба
--           с голосовыми разборами от нутрициолога и видео-рецептами
-- ============================================================

-- 1. Таблица лучших тарелок недели
-- ============================================================
CREATE TABLE IF NOT EXISTS best_plates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Информация о владельце тарелки
  owner_name TEXT NOT NULL,              -- "Айгуль М."
  owner_avatar_url TEXT,                 -- аватар участника (опционально)
  
  -- Информация о блюде
  meal_type TEXT NOT NULL,               -- 'breakfast', 'lunch', 'dinner', 'snack'
  dish_name TEXT NOT NULL,               -- "Овсянка с ягодами"
  image_url TEXT NOT NULL,               -- фото тарелки
  
  -- Голосовой разбор от нутрициолога
  voice_message_url TEXT,                -- URL аудио из Supabase Storage
  voice_duration TEXT,                   -- "1:45"
  
  -- Текстовый разбор (дублирует голосовое)
  analysis_text TEXT,
  
  -- Видео-рецепт от участника
  video_recipe_url TEXT,                 -- URL видео из Supabase Storage
  
  -- Рецепт
  recipe_description TEXT,
  ingredients JSONB,                     -- [{name: "Овсянка", amount: "50г"}, ...]
  
  -- Мета
  week_start DATE NOT NULL,              -- начало недели (понедельник)
  order_index INTEGER DEFAULT 0,         -- порядок в карусели (1-7)
  is_active BOOLEAN DEFAULT true,        -- показывать ли на текущей неделе
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Комментарии к таблице
COMMENT ON TABLE best_plates IS 'Лучшие тарелки недели от участников клуба';
COMMENT ON COLUMN best_plates.meal_type IS 'Тип приёма пищи: breakfast, lunch, dinner, snack';
COMMENT ON COLUMN best_plates.voice_message_url IS 'URL голосового разбора от Вероники (нутрициолог)';
COMMENT ON COLUMN best_plates.video_recipe_url IS 'URL видео-рецепта от участника';
COMMENT ON COLUMN best_plates.ingredients IS 'JSON массив ингредиентов: [{name, amount}]';
COMMENT ON COLUMN best_plates.week_start IS 'Понедельник недели, к которой относится тарелка';


-- 2. RLS (Row Level Security)
-- ============================================================
ALTER TABLE best_plates ENABLE ROW LEVEL SECURITY;

-- Все авторизованные пользователи могут просматривать активные тарелки
CREATE POLICY "Users can view active plates" ON best_plates
  FOR SELECT 
  TO authenticated 
  USING (is_active = true);

-- Админы могут делать всё (добавить роль admin в auth.users если нужно)
-- CREATE POLICY "Admins can do everything" ON best_plates
--   FOR ALL 
--   TO authenticated 
--   USING (auth.jwt() ->> 'role' = 'admin');


-- 3. Индексы для быстрых запросов
-- ============================================================
-- Индекс для выборки тарелок текущей недели
CREATE INDEX idx_best_plates_week ON best_plates(week_start, order_index);

-- Индекс для фильтрации по типу приёма пищи
CREATE INDEX idx_best_plates_meal_type ON best_plates(meal_type);

-- Индекс для активных тарелок
CREATE INDEX idx_best_plates_active ON best_plates(is_active) WHERE is_active = true;


-- 4. Триггер для автообновления updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_best_plates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_best_plates_updated_at
  BEFORE UPDATE ON best_plates
  FOR EACH ROW
  EXECUTE FUNCTION update_best_plates_updated_at();


-- 5. Storage бакеты
-- ============================================================

-- Бакет для голосовых сообщений нутрициолога
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-messages', 
  'voice-messages', 
  true,
  10485760,  -- 10MB лимит
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/ogg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/ogg'];

-- Бакет для видео-рецептов участников
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'video-recipes', 
  'video-recipes', 
  true,
  104857600,  -- 100MB лимит для видео
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/mov']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/mov'];

-- Бакет для фото тарелок
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'plate-images', 
  'plate-images', 
  true,
  5242880,  -- 5MB лимит
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'];


-- 6. Storage политики
-- ============================================================

-- Голосовые сообщения: публичное чтение
CREATE POLICY "Public read voice messages" ON storage.objects
  FOR SELECT 
  TO authenticated
  USING (bucket_id = 'voice-messages');

-- Видео-рецепты: публичное чтение
CREATE POLICY "Public read video recipes" ON storage.objects
  FOR SELECT 
  TO authenticated
  USING (bucket_id = 'video-recipes');

-- Фото тарелок: публичное чтение
CREATE POLICY "Public read plate images" ON storage.objects
  FOR SELECT 
  TO authenticated
  USING (bucket_id = 'plate-images');


-- 7. Вспомогательная функция: получить тарелки текущей недели
-- ============================================================
CREATE OR REPLACE FUNCTION get_current_week_plates()
RETURNS SETOF best_plates AS $$
DECLARE
  current_week_start DATE;
BEGIN
  -- Получаем понедельник текущей недели
  current_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  
  RETURN QUERY
  SELECT *
  FROM best_plates
  WHERE week_start = current_week_start
    AND is_active = true
  ORDER BY order_index ASC
  LIMIT 7;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. Пример данных для тестирования (закомментировано)
-- ============================================================
/*
INSERT INTO best_plates (owner_name, meal_type, dish_name, image_url, voice_duration, analysis_text, recipe_description, ingredients, week_start, order_index)
VALUES
(
  'Айгуль М.',
  'breakfast',
  'Овсянка с ягодами и орехами',
  'https://your-supabase.storage/plate-images/plate-1.jpg',
  '1:45',
  'Отличный завтрак! Овсянка — это медленные углеводы, которые дадут энергию на всё утро...',
  'Овсянка на воде с добавлением свежих ягод, грецких орехов и ложки мёда',
  '[{"name": "Овсяные хлопья", "amount": "50 г"}, {"name": "Вода", "amount": "150 мл"}, {"name": "Черника", "amount": "50 г"}]'::jsonb,
  date_trunc('week', CURRENT_DATE)::DATE,
  1
),
(
  'Марат К.',
  'lunch',
  'Салат с киноа и авокадо',
  'https://your-supabase.storage/plate-images/plate-2.jpg',
  '2:10',
  'Прекрасный обед! Киноа — один из немногих растительных продуктов с полным аминокислотным профилем...',
  'Тёплый салат из киноа с авокадо, черри, огурцом и лимонной заправкой',
  '[{"name": "Киноа", "amount": "80 г"}, {"name": "Авокадо", "amount": "1/2 шт"}]'::jsonb,
  date_trunc('week', CURRENT_DATE)::DATE,
  2
);
*/


-- ============================================================
-- ГОТОВО! После выполнения этой миграции:
-- 
-- 1. Загрузите голосовые разборы в бакет 'voice-messages'
--    Формат: plate-{id}-analysis.mp3
--
-- 2. Загрузите фото тарелок в бакет 'plate-images'
--    Формат: plate-{id}.jpg
--
-- 3. Добавьте записи в таблицу best_plates через Supabase Dashboard
--    или через API
--
-- 4. В коде получайте данные через:
--    const { data } = await supabase.rpc('get_current_week_plates')
--    или
--    const { data } = await supabase
--      .from('best_plates')
--      .select('*')
--      .eq('is_active', true)
--      .order('order_index')
-- ============================================================
