-- Миграция для системы геймификации
-- Выполните этот SQL в Supabase SQL Editor

-- Расширяем профиль пользователя
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_current INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_best INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Таблица достижений
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0,
  requirement_type TEXT, -- 'streak', 'lessons', 'water', 'tasks', 'login'
  requirement_value INTEGER,
  rarity TEXT DEFAULT 'common' -- 'common', 'rare', 'epic', 'legendary'
);

-- Полученные достижения пользователя
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- История XP
CREATE TABLE IF NOT EXISTS xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT, -- 'lesson_complete', 'task_submit', 'streak_bonus', 'achievement'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Статистика по городам (агрегированная)
CREATE TABLE IF NOT EXISTS city_stats (
  city TEXT PRIMARY KEY,
  total_users INTEGER DEFAULT 0,
  total_xp BIGINT DEFAULT 0,
  total_lessons_completed INTEGER DEFAULT 0,
  avg_streak DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS для user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS для xp_history
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own xp" ON xp_history;
CREATE POLICY "Users can view own xp" ON xp_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own xp" ON xp_history;
CREATE POLICY "Users can insert own xp" ON xp_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Публичный просмотр статистики городов
ALTER TABLE city_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view city stats" ON city_stats;
CREATE POLICY "Anyone can view city stats" ON city_stats
  FOR SELECT TO authenticated USING (true);

-- Функция начисления XP
CREATE OR REPLACE FUNCTION add_xp(p_user_id UUID, p_amount INTEGER, p_reason TEXT)
RETURNS void AS $$
BEGIN
  -- Добавляем запись в историю
  INSERT INTO xp_history (user_id, amount, reason) VALUES (p_user_id, p_amount, p_reason);
  
  -- Обновляем общий XP
  UPDATE profiles SET total_xp = COALESCE(total_xp, 0) + p_amount WHERE id = p_user_id;
  
  -- Обновляем уровень (каждые 1000 XP = новый уровень)
  UPDATE profiles SET level = GREATEST(1, COALESCE(total_xp, 0) / 1000 + 1) WHERE id = p_user_id;
  
  -- Обновляем статистику города
  UPDATE city_stats 
  SET total_xp = total_xp + p_amount, updated_at = NOW()
  WHERE city = (SELECT city FROM profiles WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция обновления streak
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_last_date DATE;
  v_today DATE := CURRENT_DATE;
  v_current_streak INTEGER;
BEGIN
  SELECT last_activity_date, streak_current INTO v_last_date, v_current_streak
  FROM profiles WHERE id = p_user_id;
  
  IF v_last_date = v_today THEN
    -- Уже заходил сегодня
    RETURN;
  ELSIF v_last_date = v_today - 1 THEN
    -- Заходил вчера - продолжаем streak
    UPDATE profiles SET 
      streak_current = COALESCE(streak_current, 0) + 1,
      streak_best = GREATEST(COALESCE(streak_best, 0), COALESCE(streak_current, 0) + 1),
      last_activity_date = v_today
    WHERE id = p_user_id;
  ELSE
    -- Пропустил день - сброс streak
    UPDATE profiles SET 
      streak_current = 1,
      last_activity_date = v_today
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция обновления статистики города
CREATE OR REPLACE FUNCTION update_city_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- При изменении города пользователя
  IF OLD.city IS DISTINCT FROM NEW.city THEN
    -- Уменьшаем счётчик старого города
    IF OLD.city IS NOT NULL THEN
      UPDATE city_stats SET 
        total_users = total_users - 1,
        total_xp = total_xp - COALESCE(OLD.total_xp, 0),
        updated_at = NOW()
      WHERE city = OLD.city;
    END IF;
    
    -- Увеличиваем счётчик нового города
    IF NEW.city IS NOT NULL THEN
      INSERT INTO city_stats (city, total_users, total_xp)
      VALUES (NEW.city, 1, COALESCE(NEW.total_xp, 0))
      ON CONFLICT (city) DO UPDATE SET
        total_users = city_stats.total_users + 1,
        total_xp = city_stats.total_xp + COALESCE(NEW.total_xp, 0),
        updated_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер на profiles для обновления city_stats
DROP TRIGGER IF EXISTS trigger_update_city_stats ON profiles;
CREATE TRIGGER trigger_update_city_stats
  AFTER UPDATE OF city ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_city_stats();

-- Заполняем таблицу достижений
INSERT INTO achievements (id, title, description, icon, xp_reward, requirement_type, requirement_value, rarity) VALUES
-- Streak
('streak_3', 'Первые шаги', '3 дня подряд в приложении', '🔥', 50, 'streak', 3, 'common'),
('streak_7', 'Неделя силы', '7 дней подряд без пропусков', '💪', 150, 'streak', 7, 'common'),
('streak_14', 'Двухнедельный марафон', '14 дней подряд — привычка формируется!', '🏃', 300, 'streak', 14, 'rare'),
('streak_30', 'Месяц дисциплины', '30 дней подряд — это уже образ жизни', '🎖️', 1000, 'streak', 30, 'epic'),
('streak_100', 'Легендарная серия', '100 дней подряд — вы невероятны!', '👑', 5000, 'streak', 100, 'legendary'),
-- Уроки
('first_lesson', 'Начало пути', 'Завершите первый урок', '📖', 30, 'lessons', 1, 'common'),
('lessons_10', 'Прилежный ученик', 'Пройдите 10 уроков', '📚', 200, 'lessons', 10, 'common'),
('lessons_25', 'На полпути', 'Пройдите 25 уроков — больше половины!', '🎯', 500, 'lessons', 25, 'rare'),
('lessons_40', 'Выпускник Академии', 'Пройдите все 40 уроков', '🎓', 2000, 'lessons', 40, 'legendary'),
-- Питание
('first_meal', 'Осознанное питание', 'Запишите первый приём пищи', '🍽️', 20, 'meals', 1, 'common'),
('meals_week', 'Неделя дневника', 'Ведите дневник питания 7 дней подряд', '📝', 200, 'meal_streak', 7, 'rare'),
-- Вода
('water_goal', 'Водный баланс', 'Выпейте норму воды за день', '💧', 30, 'water_goal', 1, 'common'),
('water_week', 'Аква-чемпион', 'Выполняйте норму воды 7 дней подряд', '🌊', 200, 'water_streak', 7, 'rare'),
-- Социальное
('first_share', 'Открытость', 'Поделитесь ответом в ленте урока', '💬', 30, 'shares', 1, 'common'),
('likes_received_10', 'Вдохновитель', 'Получите 10 лайков на свои ответы', '❤️', 100, 'likes_received', 10, 'rare'),
('likes_received_50', 'Звезда клуба', 'Получите 50 лайков — вы помогаете другим!', '⭐', 500, 'likes_received', 50, 'epic'),
-- Город
('city_top_10', 'Гордость города', 'Войдите в топ-10 своего города', '🏙️', 300, 'city_rank', 10, 'rare'),
('city_top_1', 'Чемпион города', 'Станьте #1 в своём городе', '🥇', 1000, 'city_rank', 1, 'legendary')
ON CONFLICT (id) DO NOTHING;

-- Инициализируем city_stats из существующих данных
INSERT INTO city_stats (city, total_users, total_xp)
SELECT city, COUNT(*), COALESCE(SUM(total_xp), 0)
FROM profiles
WHERE city IS NOT NULL
GROUP BY city
ON CONFLICT (city) DO UPDATE SET
  total_users = EXCLUDED.total_users,
  total_xp = EXCLUDED.total_xp,
  updated_at = NOW();
