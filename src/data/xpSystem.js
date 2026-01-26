// src/data/xpSystem.js

// Сколько XP даётся за действия
export const XP_REWARDS = {
  // Уроки
  lesson_complete: 50,
  lesson_with_task: 100,
  module_complete: 500,
  
  // Задания
  task_submit: 30,
  task_with_photo: 50,
  task_approved: 20, // бонус за одобрение куратором
  
  // Трекеры
  water_goal_reached: 10,
  sleep_logged: 10,
  activity_logged: 10,
  all_trackers_done: 30, // бонус за все 3
  
  // Дневник питания
  meal_logged: 15,
  meal_with_photo: 25,
  full_day_logged: 50, // завтрак + обед + ужин
  
  // Streak бонусы
  streak_3_days: 50,
  streak_7_days: 150,
  streak_14_days: 300,
  streak_30_days: 1000,
  streak_60_days: 2500,
  streak_100_days: 5000,
  
  // Социальное
  first_like_received: 20,
  answer_liked_10: 100,
  helped_others: 50, // ответ в ленте получил 5+ лайков
};

// Уровни и их названия
export const LEVELS = [
  { level: 1, minXp: 0, title: 'Новичок', icon: '🌱' },
  { level: 2, minXp: 1000, title: 'Ученик', icon: '📚' },
  { level: 3, minXp: 2500, title: 'Практик', icon: '💪' },
  { level: 4, minXp: 5000, title: 'Знаток', icon: '🎯' },
  { level: 5, minXp: 10000, title: 'Эксперт', icon: '⭐' },
  { level: 6, minXp: 20000, title: 'Мастер', icon: '🏆' },
  { level: 7, minXp: 35000, title: 'Гуру', icon: '👑' },
  { level: 8, minXp: 50000, title: 'Легенда', icon: '🌟' },
];

export const getLevelInfo = (xp) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      const currentLevel = LEVELS[i];
      const nextLevel = LEVELS[i + 1];
      const progress = nextLevel 
        ? (xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp) * 100
        : 100;
      return { ...currentLevel, progress, nextLevel };
    }
  }
  return { ...LEVELS[0], progress: 0, nextLevel: LEVELS[1] };
};

// Получить XP до следующего уровня
export const getXpToNextLevel = (xp) => {
  const levelInfo = getLevelInfo(xp);
  if (!levelInfo.nextLevel) return 0;
  return levelInfo.nextLevel.minXp - xp;
};
