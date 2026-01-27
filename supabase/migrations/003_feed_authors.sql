-- ==========================================
-- МИГРАЦИЯ: Добавление авторов в ленту здоровья
-- Дата: 2026-01-27
-- ==========================================

-- ==========================================
-- 1. ДОБАВЛЯЕМ КОЛОНКИ ДЛЯ АВТОРА
-- ==========================================

ALTER TABLE feed_posts 
ADD COLUMN IF NOT EXISTS author_name TEXT,
ADD COLUMN IF NOT EXISTS author_avatar TEXT,
ADD COLUMN IF NOT EXISTS author_role TEXT CHECK (author_role IN ('expert', 'member', NULL));

COMMENT ON COLUMN feed_posts.author_name IS 'Имя автора поста';
COMMENT ON COLUMN feed_posts.author_avatar IS 'URL аватарки автора';
COMMENT ON COLUMN feed_posts.author_role IS 'Роль автора: expert (эксперт клуба) или member (участник клуба)';

-- ==========================================
-- 2. ОБНОВЛЯЕМ СУЩЕСТВУЮЩИЕ ПОСТЫ
-- Добавляем автора "Алишер Латипов" ко всем постам кроме event
-- ==========================================

UPDATE feed_posts
SET 
  author_name = 'Алишер Латипов',
  author_avatar = 'https://static.tildacdn.com/tild3630-3439-4665-b838-373736636331/__2026-01-27__081917.png',
  author_role = 'expert'
WHERE type != 'event' AND author_name IS NULL;

-- ==========================================
-- 3. ДОБАВЛЯЕМ НОВЫЕ ПОСТЫ
-- ==========================================

-- Пост от Татьяны (участница клуба) с фото завтрака
INSERT INTO feed_posts (
  type, 
  author_name, 
  author_avatar, 
  author_role,
  media_url, 
  text, 
  published, 
  published_at
) VALUES (
  'image',
  'Татьяна',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  'member',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
  'Мой завтрак по рекомендациям Алишера! 🍳

Уже вторую неделю готовлю по тарелке здоровья — энергии реально больше!

Девочки, кто ещё пробовал?',
  true,
  now() - interval '12 hours'
);

-- Видео-пост с YouTube (обновляем существующий или добавляем новый)
INSERT INTO feed_posts (
  type,
  author_name,
  author_avatar,
  author_role,
  media_url,
  text,
  published,
  published_at
) VALUES (
  'video',
  'Алишер Латипов',
  'https://static.tildacdn.com/tild3630-3439-4665-b838-373736636331/__2026-01-27__081917.png',
  'expert',
  'https://youtube.com/shorts/CsTIxzNUHTg',
  '3 продукта, которые убивают вашу щитовидку 👇 Смотрите до конца!',
  true,
  now() - interval '6 hours'
) ON CONFLICT DO NOTHING;

-- Аудио-пост от Алишера
INSERT INTO feed_posts (
  type,
  author_name,
  author_avatar,
  author_role,
  media_url,
  duration,
  text,
  published,
  published_at
) VALUES (
  'audio',
  'Алишер Латипов',
  'https://static.tildacdn.com/tild3630-3439-4665-b838-373736636331/__2026-01-27__081917.png',
  'expert',
  'https://storage.supabase.co/example/audio.mp3',
  180,
  'Голосовое сообщение: отвечаю на ваши вопросы про железо и ферритин',
  true,
  now() - interval '2 days'
) ON CONFLICT DO NOTHING;

-- Текстовый пост про утренний ритуал
INSERT INTO feed_posts (
  type,
  author_name,
  author_avatar,
  author_role,
  text,
  published,
  published_at
) VALUES (
  'text',
  'Алишер Латипов',
  'https://static.tildacdn.com/tild3630-3439-4665-b838-373736636331/__2026-01-27__081917.png',
  'expert',
  'Утренний ритуал, который изменит ваш день ☀️

1. Стакан воды сразу после пробуждения
2. 5 минут растяжки или лёгкой зарядки  
3. Завтрак с белком (не кофе на голодный желудок!)
4. 10 минут без телефона

Попробуйте хотя бы неделю — и напишите, что изменилось 💪',
  true,
  now() - interval '3 days'
) ON CONFLICT DO NOTHING;

-- ==========================================
-- 4. СОЗДАЁМ ИНДЕКС ДЛЯ БЫСТРОГО ПОИСКА ПО АВТОРУ
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON feed_posts(author_name) 
WHERE author_name IS NOT NULL;

-- ==========================================
-- ГОТОВО!
-- После применения миграции в feedService.js 
-- можно переключить USE_MOCK = false
-- ==========================================
