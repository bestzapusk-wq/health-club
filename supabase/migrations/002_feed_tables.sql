-- ==========================================
-- ЛЕНТА НОВОСТЕЙ (Content Feed)
-- ==========================================

-- Таблица постов
CREATE TABLE IF NOT EXISTS feed_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL CHECK (type IN ('video', 'text', 'audio', 'image', 'event')),
  
  -- Контент
  text            TEXT,                    -- текст поста или подпись
  media_url       TEXT,                    -- video/audio/image URL
  thumbnail_url   TEXT,                    -- превью для видео
  duration        INTEGER,                 -- секунды для video/audio
  
  -- Для event
  event_title     TEXT,                    -- название мероприятия
  event_datetime  TIMESTAMP WITH TIME ZONE,-- дата и время события
  event_link      TEXT,                    -- ссылка на Zoom/эфир
  
  -- Мета
  published       BOOLEAN DEFAULT false,
  published_at    TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_published ON feed_posts(published_at DESC) 
WHERE published = true;

-- Таблица реакций
CREATE TABLE IF NOT EXISTS feed_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  emoji       TEXT NOT NULL,  -- '❤️', '🔥', '👍', '😮', '👏'
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(post_id, user_id)  -- один пользователь = одна реакция на пост
);

CREATE INDEX IF NOT EXISTS idx_feed_reactions_post ON feed_reactions(post_id);

-- Таблица комментариев
CREATE TABLE IF NOT EXISTS feed_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  text        TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON feed_comments(post_id, created_at);

-- Таблица напоминаний о событиях
CREATE TABLE IF NOT EXISTS event_reminders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_reminders_post ON event_reminders(post_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_user ON event_reminders(user_id);

-- ==========================================
-- RLS ПОЛИТИКИ
-- ==========================================

ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

-- feed_posts: чтение для всех авторизованных
CREATE POLICY "Posts readable by authenticated" ON feed_posts
  FOR SELECT TO authenticated
  USING (published = true);

-- feed_reactions: CRUD для своих реакций
CREATE POLICY "Users can view reactions" ON feed_reactions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own reactions" ON feed_reactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reactions" ON feed_reactions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reactions" ON feed_reactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- feed_comments: чтение всех, запись/удаление своих
CREATE POLICY "Comments readable by all" ON feed_comments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments" ON feed_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON feed_comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- event_reminders: CRUD для своих
CREATE POLICY "Users can view own reminders" ON event_reminders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own reminders" ON event_reminders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reminders" ON event_reminders
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ==========================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- ==========================================

INSERT INTO feed_posts (type, event_title, event_datetime, event_link, text, published, published_at) VALUES
('event', 'Разбор анализов: щитовидная железа', '2026-01-31 19:00:00+06', 'https://zoom.us/j/example', 'Разберём самые частые ошибки в интерпретации ТТГ, Т3, Т4. Приходите с вопросами!', true, now() - interval '1 hour');

INSERT INTO feed_posts (type, text, published, published_at) VALUES
('text', 'Почему витамин D так важен для вашей энергии? 🌞

Многие думают, что витамин D — это просто "витамин для костей". Но на самом деле он влияет на:

• Энергию и настроение
• Иммунитет  
• Гормональный баланс
• Качество сна

Оптимальный уровень: 40-60 нг/мл (не 30, как пишут в референсах!)

Если у вас меньше 30 — это уже дефицит, который нужно восполнять.

Сдавали недавно? Напишите свой результат в комментариях 👇', true, now() - interval '2 hours');

INSERT INTO feed_posts (type, media_url, text, published, published_at) VALUES
('image', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800', 'Ваша тарелка здоровья на каждый день 🥗

50% — овощи
25% — белок
25% — сложные углеводы

Сохраняйте и используйте!', true, now() - interval '1 day');
