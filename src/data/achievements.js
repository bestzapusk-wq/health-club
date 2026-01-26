// src/data/achievements.js

export const ACHIEVEMENTS = [
  // STREAK
  {
    id: 'streak_3',
    title: 'Первые шаги',
    description: '3 дня подряд в приложении',
    icon: '🔥',
    xpReward: 50,
    requirementType: 'streak',
    requirementValue: 3,
    rarity: 'common'
  },
  {
    id: 'streak_7',
    title: 'Неделя силы',
    description: '7 дней подряд без пропусков',
    icon: '💪',
    xpReward: 150,
    requirementType: 'streak',
    requirementValue: 7,
    rarity: 'common'
  },
  {
    id: 'streak_14',
    title: 'Двухнедельный марафон',
    description: '14 дней подряд — привычка формируется!',
    icon: '🏃',
    xpReward: 300,
    requirementType: 'streak',
    requirementValue: 14,
    rarity: 'rare'
  },
  {
    id: 'streak_30',
    title: 'Месяц дисциплины',
    description: '30 дней подряд — это уже образ жизни',
    icon: '🎖️',
    xpReward: 1000,
    requirementType: 'streak',
    requirementValue: 30,
    rarity: 'epic'
  },
  {
    id: 'streak_100',
    title: 'Легендарная серия',
    description: '100 дней подряд — вы невероятны!',
    icon: '👑',
    xpReward: 5000,
    requirementType: 'streak',
    requirementValue: 100,
    rarity: 'legendary'
  },

  // УРОКИ
  {
    id: 'first_lesson',
    title: 'Начало пути',
    description: 'Завершите первый урок',
    icon: '📖',
    xpReward: 30,
    requirementType: 'lessons',
    requirementValue: 1,
    rarity: 'common'
  },
  {
    id: 'lessons_10',
    title: 'Прилежный ученик',
    description: 'Пройдите 10 уроков',
    icon: '📚',
    xpReward: 200,
    requirementType: 'lessons',
    requirementValue: 10,
    rarity: 'common'
  },
  {
    id: 'lessons_25',
    title: 'На полпути',
    description: 'Пройдите 25 уроков — больше половины!',
    icon: '🎯',
    xpReward: 500,
    requirementType: 'lessons',
    requirementValue: 25,
    rarity: 'rare'
  },
  {
    id: 'lessons_40',
    title: 'Выпускник Академии',
    description: 'Пройдите все 40 уроков',
    icon: '🎓',
    xpReward: 2000,
    requirementType: 'lessons',
    requirementValue: 40,
    rarity: 'legendary'
  },

  // МОДУЛИ
  {
    id: 'module_1_complete',
    title: 'Введение пройдено',
    description: 'Завершите модуль "Введение в клуб"',
    icon: '✅',
    xpReward: 500,
    requirementType: 'module',
    requirementValue: 'intro',
    rarity: 'common'
  },
  {
    id: 'all_modules',
    title: 'Мастер здоровья',
    description: 'Завершите все 6 модулей обучения',
    icon: '🏆',
    xpReward: 3000,
    requirementType: 'modules_all',
    requirementValue: 6,
    rarity: 'legendary'
  },

  // ПИТАНИЕ
  {
    id: 'first_meal',
    title: 'Осознанное питание',
    description: 'Запишите первый приём пищи',
    icon: '🍽️',
    xpReward: 20,
    requirementType: 'meals',
    requirementValue: 1,
    rarity: 'common'
  },
  {
    id: 'meals_week',
    title: 'Неделя дневника',
    description: 'Ведите дневник питания 7 дней подряд',
    icon: '📝',
    xpReward: 200,
    requirementType: 'meal_streak',
    requirementValue: 7,
    rarity: 'rare'
  },

  // ВОДА
  {
    id: 'water_goal',
    title: 'Водный баланс',
    description: 'Выпейте норму воды за день',
    icon: '💧',
    xpReward: 30,
    requirementType: 'water_goal',
    requirementValue: 1,
    rarity: 'common'
  },
  {
    id: 'water_week',
    title: 'Аква-чемпион',
    description: 'Выполняйте норму воды 7 дней подряд',
    icon: '🌊',
    xpReward: 200,
    requirementType: 'water_streak',
    requirementValue: 7,
    rarity: 'rare'
  },

  // СОЦИАЛЬНОЕ
  {
    id: 'first_share',
    title: 'Открытость',
    description: 'Поделитесь ответом в ленте урока',
    icon: '💬',
    xpReward: 30,
    requirementType: 'shares',
    requirementValue: 1,
    rarity: 'common'
  },
  {
    id: 'likes_received_10',
    title: 'Вдохновитель',
    description: 'Получите 10 лайков на свои ответы',
    icon: '❤️',
    xpReward: 100,
    requirementType: 'likes_received',
    requirementValue: 10,
    rarity: 'rare'
  },
  {
    id: 'likes_received_50',
    title: 'Звезда клуба',
    description: 'Получите 50 лайков — вы помогаете другим!',
    icon: '⭐',
    xpReward: 500,
    requirementType: 'likes_received',
    requirementValue: 50,
    rarity: 'epic'
  },

  // ГОРОД
  {
    id: 'city_top_10',
    title: 'Гордость города',
    description: 'Войдите в топ-10 своего города',
    icon: '🏙️',
    xpReward: 300,
    requirementType: 'city_rank',
    requirementValue: 10,
    rarity: 'rare'
  },
  {
    id: 'city_top_1',
    title: 'Чемпион города',
    description: 'Станьте #1 в своём городе',
    icon: '🥇',
    xpReward: 1000,
    requirementType: 'city_rank',
    requirementValue: 1,
    rarity: 'legendary'
  },
];

// Цвета редкости
export const RARITY_COLORS = {
  common: { bg: '#f0f0f0', text: '#666', label: 'Обычное', border: '#e0e0e0' },
  rare: { bg: '#e3f2fd', text: '#1565c0', label: 'Редкое', border: '#90caf9' },
  epic: { bg: '#f3e5f5', text: '#7b1fa2', label: 'Эпическое', border: '#ce93d8' },
  legendary: { bg: '#fff8e1', text: '#e65100', label: 'Легендарное', border: '#ffcc80' }
};

// Получить достижение по ID
export const getAchievementById = (id) => {
  return ACHIEVEMENTS.find(a => a.id === id);
};

// Фильтр достижений по типу
export const getAchievementsByType = (type) => {
  return ACHIEVEMENTS.filter(a => a.requirementType === type);
};

// Проверка выполнения достижения
export const checkAchievement = (achievement, userStats) => {
  switch (achievement.requirementType) {
    case 'streak':
      return userStats.streak_current >= achievement.requirementValue;
    case 'lessons':
      return userStats.lessonsCompleted >= achievement.requirementValue;
    case 'meals':
      return userStats.mealsLogged >= achievement.requirementValue;
    case 'water_goal':
      return userStats.waterGoalsReached >= achievement.requirementValue;
    case 'shares':
      return userStats.sharesCount >= achievement.requirementValue;
    case 'likes_received':
      return userStats.likesReceived >= achievement.requirementValue;
    case 'city_rank':
      return userStats.cityRank && userStats.cityRank <= achievement.requirementValue;
    default:
      return false;
  }
};
