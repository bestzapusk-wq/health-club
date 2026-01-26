import { supabase } from './supabase';

// ==========================================
// MOCK DATA для разработки
// ==========================================

// Авторы постов
const AUTHORS = {
  alisher: {
    name: 'Алишер Латипов',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    role: 'expert' // эксперт клуба
  },
  tatyana: {
    name: 'Татьяна',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    role: 'member' // участник клуба
  }
};

const MOCK_POSTS = [
  {
    id: '2',
    type: 'text',
    author_name: AUTHORS.alisher.name,
    author_avatar: AUTHORS.alisher.avatar,
    author_role: AUTHORS.alisher.role,
    text: `Почему витамин D так важен для вашей энергии? 🌞

Многие думают, что витамин D — это просто "витамин для костей". Но на самом деле он влияет на:

• Энергию и настроение
• Иммунитет  
• Гормональный баланс
• Качество сна

Оптимальный уровень: 40-60 нг/мл (не 30, как пишут в референсах!)

Если у вас меньше 30 — это уже дефицит, который нужно восполнять.

Сдавали недавно? Напишите свой результат в комментариях 👇`,
    published_at: '2026-01-27T10:00:00Z',
    reactions: { '❤️': 32, '🔥': 12, '👍': 8 },
    user_reaction: '❤️',
    comments_count: 24
  },
  {
    id: '3',
    type: 'video',
    author_name: AUTHORS.alisher.name,
    author_avatar: AUTHORS.alisher.avatar,
    author_role: AUTHORS.alisher.role,
    media_url: 'https://youtube.com/shorts/CsTIxzNUHTg',
    text: '3 продукта, которые убивают вашу щитовидку 👇 Смотрите до конца!',
    published_at: '2026-01-26T18:00:00Z',
    reactions: { '😮': 45, '❤️': 32, '🔥': 18 },
    user_reaction: '😮',
    comments_count: 28
  },
  {
    id: '1',
    type: 'event',
    // Эфиры без автора — они жёлтые и остаются как есть
    event_title: 'Разбор анализов: щитовидная железа',
    event_datetime: '2026-01-31T19:00:00+06:00',
    event_link: 'https://zoom.us/j/example',
    text: 'Разберём самые частые ошибки в интерпретации ТТГ, Т3, Т4. Приходите с вопросами!',
    published_at: '2026-01-27T09:00:00Z',
    reactions: { '🔥': 23, '👏': 8, '❤️': 15 },
    user_reaction: null,
    comments_count: 15
  },
  {
    id: '7',
    type: 'image',
    author_name: AUTHORS.tatyana.name,
    author_avatar: AUTHORS.tatyana.avatar,
    author_role: AUTHORS.tatyana.role,
    media_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    text: 'Мой завтрак по рекомендациям Алишера! 🍳\n\nУже вторую неделю готовлю по тарелке здоровья — энергии реально больше!\n\nДевочки, кто ещё пробовал?',
    published_at: '2026-01-26T14:30:00Z',
    reactions: { '❤️': 89, '🔥': 34, '👏': 21 },
    user_reaction: null,
    comments_count: 18
  },
  {
    id: '4',
    type: 'image',
    author_name: AUTHORS.alisher.name,
    author_avatar: AUTHORS.alisher.avatar,
    author_role: AUTHORS.alisher.role,
    media_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
    text: 'Ваша тарелка здоровья на каждый день 🥗\n\n50% — овощи\n25% — белок\n25% — сложные углеводы\n\nСохраняйте и используйте!',
    published_at: '2026-01-26T12:00:00Z',
    reactions: { '❤️': 67, '👍': 23 },
    user_reaction: null,
    comments_count: 12
  },
  {
    id: '5',
    type: 'audio',
    author_name: AUTHORS.alisher.name,
    author_avatar: AUTHORS.alisher.avatar,
    author_role: AUTHORS.alisher.role,
    media_url: 'https://storage.supabase.co/example/audio.mp3',
    duration: 180,
    text: 'Голосовое сообщение: отвечаю на ваши вопросы про железо и ферритин',
    published_at: '2026-01-25T15:00:00Z',
    reactions: { '❤️': 18, '👏': 7 },
    user_reaction: null,
    comments_count: 5
  },
  {
    id: '6',
    type: 'text',
    author_name: AUTHORS.alisher.name,
    author_avatar: AUTHORS.alisher.avatar,
    author_role: AUTHORS.alisher.role,
    text: `Утренний ритуал, который изменит ваш день ☀️

1. Стакан воды сразу после пробуждения
2. 5 минут растяжки или лёгкой зарядки  
3. Завтрак с белком (не кофе на голодный желудок!)
4. 10 минут без телефона

Попробуйте хотя бы неделю — и напишите, что изменилось 💪`,
    published_at: '2026-01-25T08:00:00Z',
    reactions: { '🔥': 54, '❤️': 41, '👍': 19 },
    user_reaction: '🔥',
    comments_count: 31
  }
];

const MOCK_COMMENTS = {
  '1': [
    { id: 'c1', user_name: 'Айгуль', text: 'Обязательно приду! Как раз есть вопросы по Т4', created_at: '2026-01-27T10:30:00Z' },
    { id: 'c2', user_name: 'Дана', text: 'Напомните пожалуйста за час до эфира 🙏', created_at: '2026-01-27T11:15:00Z' },
  ],
  '2': [
    { id: 'c3', user_name: 'Мария', text: 'У меня 28, врач сказал норма... Теперь понимаю что нет', created_at: '2026-01-27T10:45:00Z' },
    { id: 'c4', user_name: 'Алия', text: 'А какой витамин D лучше принимать?', created_at: '2026-01-27T11:00:00Z' },
    { id: 'c5', user_name: 'Камила', text: '22 нг/мл, начала пить 5000 МЕ', created_at: '2026-01-27T12:30:00Z' },
  ],
  '3': [
    { id: 'c6', user_name: 'Жанна', text: 'Не знала про сою! Спасибо за информацию', created_at: '2026-01-26T19:00:00Z' },
    { id: 'c7', user_name: 'Асель', text: 'А что насчёт крестоцветных?', created_at: '2026-01-26T19:30:00Z' },
  ]
};

// Флаг использования mock данных (переключить на false для реальной БД)
const USE_MOCK = true;

// ==========================================
// ПОСТЫ
// ==========================================

/**
 * Получить ленту постов с реакциями
 */
export async function getFeedPosts(limit = 10, offset = 0, userId = null) {
  if (USE_MOCK) {
    // Имитация задержки сети
    await new Promise(r => setTimeout(r, 300));
    return MOCK_POSTS.slice(offset, offset + limit);
  }

  try {
    const { data, error } = await supabase
      .from('feed_posts')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Получаем реакции и комментарии для каждого поста
    const postsWithMeta = await Promise.all(data.map(async (post) => {
      const [reactions, userReaction, commentsCount] = await Promise.all([
        getReactionCounts(post.id),
        userId ? getUserReaction(post.id, userId) : null,
        getCommentsCount(post.id)
      ]);

      return {
        ...post,
        reactions,
        user_reaction: userReaction,
        comments_count: commentsCount
      };
    }));

    return postsWithMeta;
  } catch (error) {
    console.error('Error fetching feed:', error);
    return [];
  }
}

// ==========================================
// РЕАКЦИИ
// ==========================================

const AVAILABLE_REACTIONS = ['❤️', '🔥', '👍', '😮', '👏'];

export function getAvailableReactions() {
  return AVAILABLE_REACTIONS;
}

/**
 * Получить счётчики реакций для поста
 */
async function getReactionCounts(postId) {
  if (USE_MOCK) {
    return MOCK_POSTS.find(p => p.id === postId)?.reactions || {};
  }

  const { data, error } = await supabase
    .from('feed_reactions')
    .select('emoji')
    .eq('post_id', postId);

  if (error) return {};

  return data.reduce((acc, { emoji }) => {
    acc[emoji] = (acc[emoji] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Получить реакцию пользователя
 */
async function getUserReaction(postId, userId) {
  if (USE_MOCK) {
    return MOCK_POSTS.find(p => p.id === postId)?.user_reaction || null;
  }

  const { data } = await supabase
    .from('feed_reactions')
    .select('emoji')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  return data?.emoji || null;
}

/**
 * Поставить/изменить реакцию
 */
export async function setReaction(postId, userId, emoji) {
  if (USE_MOCK) {
    const post = MOCK_POSTS.find(p => p.id === postId);
    if (post) {
      // Убираем старую реакцию
      if (post.user_reaction && post.reactions[post.user_reaction]) {
        post.reactions[post.user_reaction]--;
        if (post.reactions[post.user_reaction] === 0) {
          delete post.reactions[post.user_reaction];
        }
      }
      // Добавляем новую
      post.reactions[emoji] = (post.reactions[emoji] || 0) + 1;
      post.user_reaction = emoji;
    }
    return { success: true };
  }

  const { error } = await supabase
    .from('feed_reactions')
    .upsert({
      post_id: postId,
      user_id: userId,
      emoji
    }, {
      onConflict: 'post_id,user_id'
    });

  return { success: !error, error };
}

/**
 * Убрать реакцию
 */
export async function removeReaction(postId, userId) {
  if (USE_MOCK) {
    const post = MOCK_POSTS.find(p => p.id === postId);
    if (post && post.user_reaction) {
      if (post.reactions[post.user_reaction]) {
        post.reactions[post.user_reaction]--;
        if (post.reactions[post.user_reaction] === 0) {
          delete post.reactions[post.user_reaction];
        }
      }
      post.user_reaction = null;
    }
    return { success: true };
  }

  const { error } = await supabase
    .from('feed_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  return { success: !error, error };
}

// ==========================================
// КОММЕНТАРИИ
// ==========================================

/**
 * Получить количество комментариев
 */
async function getCommentsCount(postId) {
  if (USE_MOCK) {
    return MOCK_COMMENTS[postId]?.length || 0;
  }

  const { count } = await supabase
    .from('feed_comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  return count || 0;
}

/**
 * Получить комментарии к посту
 */
export async function getComments(postId, limit = 20) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    return MOCK_COMMENTS[postId] || [];
  }

  const { data, error } = await supabase
    .from('feed_comments')
    .select(`
      id,
      text,
      created_at,
      profiles:user_id (
        first_name,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) return [];

  return data.map(c => ({
    id: c.id,
    user_name: c.profiles?.first_name || 'Пользователь',
    avatar_url: c.profiles?.avatar_url,
    text: c.text,
    created_at: c.created_at
  }));
}

/**
 * Добавить комментарий
 */
export async function addComment(postId, userId, text, userName = 'Вы') {
  if (USE_MOCK) {
    const newComment = {
      id: `c${Date.now()}`,
      user_name: userName,
      text,
      created_at: new Date().toISOString()
    };
    if (!MOCK_COMMENTS[postId]) {
      MOCK_COMMENTS[postId] = [];
    }
    MOCK_COMMENTS[postId].push(newComment);
    
    // Обновляем счётчик
    const post = MOCK_POSTS.find(p => p.id === postId);
    if (post) post.comments_count++;
    
    return { success: true, comment: newComment };
  }

  const { data, error } = await supabase
    .from('feed_comments')
    .insert({
      post_id: postId,
      user_id: userId,
      text
    })
    .select()
    .single();

  return { success: !error, comment: data, error };
}

/**
 * Удалить комментарий
 */
export async function deleteComment(commentId, userId) {
  if (USE_MOCK) {
    for (const postId in MOCK_COMMENTS) {
      const idx = MOCK_COMMENTS[postId].findIndex(c => c.id === commentId);
      if (idx !== -1) {
        MOCK_COMMENTS[postId].splice(idx, 1);
        const post = MOCK_POSTS.find(p => p.id === postId);
        if (post) post.comments_count--;
        break;
      }
    }
    return { success: true };
  }

  const { error } = await supabase
    .from('feed_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);

  return { success: !error, error };
}

// ==========================================
// НАПОМИНАНИЯ О СОБЫТИЯХ
// ==========================================

const mockReminders = new Set();

/**
 * Проверить, подписан ли пользователь на напоминание
 */
export async function hasReminder(postId, userId) {
  if (USE_MOCK) {
    return mockReminders.has(`${postId}-${userId}`);
  }

  const { data } = await supabase
    .from('event_reminders')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  return !!data;
}

/**
 * Подписаться на напоминание
 */
export async function setReminder(postId, userId) {
  if (USE_MOCK) {
    mockReminders.add(`${postId}-${userId}`);
    return { success: true };
  }

  const { error } = await supabase
    .from('event_reminders')
    .insert({
      post_id: postId,
      user_id: userId
    });

  return { success: !error, error };
}

/**
 * Отписаться от напоминания
 */
export async function removeReminder(postId, userId) {
  if (USE_MOCK) {
    mockReminders.delete(`${postId}-${userId}`);
    return { success: true };
  }

  const { error } = await supabase
    .from('event_reminders')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  return { success: !error, error };
}

// ==========================================
// УТИЛИТЫ
// ==========================================

/**
 * Форматирование времени публикации
 */
export function formatPublishedTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays < 7) return `${diffDays} дн назад`;
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short'
  });
}

/**
 * Форматирование даты события
 */
export function formatEventDate(dateString) {
  const date = new Date(dateString);
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');
  
  return `${dayName}, ${day} ${month} в ${hours}:${mins}`;
}

/**
 * Форматирование длительности
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
