// src/data/learningModules.js

export const learningModules = [
  // ==========================================
  // МОДУЛЬ 1: Введение в клуб (Шаги 1-9)
  // ==========================================
  {
    id: 'intro',
    slug: 'intro',
    title: 'Введение в клуб',
    description: 'Базовые принципы здоровья и знакомство с подходом клуба',
    icon: '🎯',
    color: '#4CAF50',
    orderIndex: 1,
    lessons: [
      {
        id: 'intro-1',
        slug: 'basic-principles',
        title: 'Базовые принципы здоровья',
        orderIndex: 1,
        isStopLesson: true,
        youtubeId: null,
        duration: '20:00',
        taskDescription: 'Запишите 3 главных принципа, которые вы усвоили из урока'
      },
      {
        id: 'intro-2',
        slug: 'stress-cortisol',
        title: 'Стресс и кортизол',
        orderIndex: 2,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Оцените свой уровень стресса по шкале от 1 до 10'
      },
      {
        id: 'intro-3',
        slug: 'physical-activity',
        title: 'Физическая активность',
        orderIndex: 3,
        isStopLesson: true,
        youtubeId: null,
        duration: '20:00',
        taskDescription: 'Составьте план физической активности на неделю'
      },
      {
        id: 'intro-4',
        slug: 'water',
        title: 'Вода',
        orderIndex: 4,
        isStopLesson: false,
        youtubeId: null,
        duration: '15:00'
      },
      {
        id: 'intro-5',
        slug: 'deficits',
        title: '6 основных дефицитов организма',
        orderIndex: 5,
        isStopLesson: true,
        youtubeId: null,
        duration: '30:00',
        taskDescription: 'Определите, какие дефициты могут быть у вас'
      },
      {
        id: 'intro-6',
        slug: 'nutrition-basics',
        title: 'Основы питания',
        orderIndex: 6,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Проанализируйте свой рацион за последние 3 дня'
      },
      {
        id: 'intro-7',
        slug: 'mental-health',
        title: 'Состояние ментального здоровья',
        orderIndex: 7,
        isStopLesson: false,
        youtubeId: null,
        duration: '20:00'
      },
      {
        id: 'intro-8',
        slug: 'self-worth',
        title: 'Самоценность',
        orderIndex: 8,
        isStopLesson: true,
        youtubeId: null,
        duration: '20:00',
        taskDescription: 'Напишите 5 вещей, за которые вы благодарны себе'
      },
      {
        id: 'intro-9',
        slug: 'vision',
        title: 'Видение',
        orderIndex: 9,
        isStopLesson: true,
        youtubeId: null,
        duration: '15:00',
        taskDescription: 'Опишите своё идеальное состояние здоровья через 1 год'
      }
    ]
  },

  // ==========================================
  // МОДУЛЬ 2: Питание (Шаги 10-14)
  // ==========================================
  {
    id: 'nutrition',
    slug: 'nutrition',
    title: 'Питание',
    description: 'Всё о правильном питании: от калорий до расстройств пищевого поведения',
    icon: '🥗',
    color: '#FF9800',
    orderIndex: 2,
    lessons: [
      {
        id: 'nutrition-1',
        slug: 'macros',
        title: 'Калории, белки, жиры, углеводы',
        orderIndex: 10,
        isStopLesson: true,
        youtubeId: null,
        duration: '30:00',
        taskDescription: 'Рассчитайте свою норму КБЖУ'
      },
      {
        id: 'nutrition-2',
        slug: 'sugar-gluten-dairy',
        title: 'Сахар, глютен, молочные продукты',
        orderIndex: 11,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Проведите эксперимент: исключите один продукт на 3 дня'
      },
      {
        id: 'nutrition-3',
        slug: 'micronutrients',
        title: 'Микронутриенты',
        orderIndex: 12,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Составьте список продуктов, богатых микронутриентами'
      },
      {
        id: 'nutrition-4',
        slug: 'balanced-diet',
        title: 'Сбалансированный рацион питания',
        orderIndex: 13,
        isStopLesson: true,
        youtubeId: null,
        duration: '20:00',
        taskDescription: 'Составьте меню на 3 дня'
      },
      {
        id: 'nutrition-5',
        slug: 'eating-disorders',
        title: 'Расстройства пищевого поведения',
        orderIndex: 14,
        isStopLesson: false,
        youtubeId: null,
        duration: '25:00'
      }
    ]
  },

  // ==========================================
  // МОДУЛЬ 3: ЖКТ (Шаги 15-25)
  // ==========================================
  {
    id: 'gut',
    slug: 'gut',
    title: 'ЖКТ',
    description: 'Здоровье желудочно-кишечного тракта от А до Я',
    icon: '🫃',
    color: '#2196F3',
    orderIndex: 3,
    lessons: [
      {
        id: 'gut-1',
        slug: 'digestion',
        title: 'Пищеварение и выведение',
        orderIndex: 15,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Отследите своё пищеварение в течение 3 дней'
      },
      {
        id: 'gut-2',
        slug: 'stomach',
        title: 'Желудок',
        orderIndex: 16,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Проверьте кислотность желудка домашним тестом'
      },
      {
        id: 'gut-3',
        slug: 'gallbladder',
        title: 'Желчный пузырь',
        description: '12-ти перстная кишка, желчный пузырь, поджелудочная железа',
        orderIndex: 17,
        isStopLesson: true,
        youtubeId: null,
        duration: '30:00',
        taskDescription: 'Добавьте желчегонные продукты в рацион'
      },
      {
        id: 'gut-4',
        slug: 'pancreas',
        title: 'Поджелудочная железа',
        orderIndex: 18,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Оцените симптомы нарушения работы поджелудочной'
      },
      {
        id: 'gut-5',
        slug: 'intestine-health',
        title: 'Здоровье кишечника',
        orderIndex: 19,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Добавьте пробиотики и пребиотики в рацион'
      },
      {
        id: 'gut-6',
        slug: 'liver',
        title: 'Печень',
        orderIndex: 20,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Исключите алкоголь и добавьте гепатопротекторы'
      },
      {
        id: 'gut-7',
        slug: 'gut-pathologies',
        title: 'Патологии ЖКТ',
        orderIndex: 21,
        isStopLesson: true,
        youtubeId: null,
        duration: '30:00',
        taskDescription: 'Определите, есть ли у вас признаки патологий'
      },
      {
        id: 'gut-8',
        slug: 'dzhvp',
        title: 'ДЖВП',
        description: 'Дискинезия желчевыводящих путей',
        orderIndex: 22,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Выполните упражнения для желчного пузыря'
      },
      {
        id: 'gut-9',
        slug: 'constipation',
        title: 'Запоры',
        orderIndex: 23,
        isStopLesson: true,
        youtubeId: null,
        duration: '20:00',
        taskDescription: 'Увеличьте потребление клетчатки'
      },
      {
        id: 'gut-10',
        slug: 'cholesterol',
        title: 'Холестерин',
        orderIndex: 24,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Сдайте анализ на липидный профиль'
      },
      {
        id: 'gut-11',
        slug: 'intestine-health-2',
        title: 'Здоровье кишечника (продолжение)',
        orderIndex: 25,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Составьте план восстановления кишечника'
      }
    ]
  },

  // ==========================================
  // МОДУЛЬ 4: Лабораторные анализы (Шаги 26-31)
  // ==========================================
  {
    id: 'lab-tests',
    slug: 'lab-tests',
    title: 'Лабораторные анализы',
    description: 'Как читать и интерпретировать анализы',
    icon: '🔬',
    color: '#9C27B0',
    orderIndex: 4,
    lessons: [
      {
        id: 'lab-1',
        slug: 'checkup',
        title: 'Лабораторные анализы Check-Up',
        orderIndex: 26,
        isStopLesson: true,
        youtubeId: null,
        duration: '30:00',
        taskDescription: 'Составьте список анализов для своего чекапа'
      },
      {
        id: 'lab-2',
        slug: 'thyroid',
        title: 'Оценка состояния щитовидной железы',
        orderIndex: 27,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Проверьте свои анализы щитовидной железы'
      },
      {
        id: 'lab-3',
        slug: 'metabolism',
        title: 'Белковые, жировые, углеводные обмены',
        orderIndex: 28,
        isStopLesson: true,
        youtubeId: null,
        duration: '30:00',
        taskDescription: 'Оцените свои показатели обменов'
      },
      {
        id: 'lab-4',
        slug: 'ultrasound',
        title: 'УЗИ',
        orderIndex: 29,
        isStopLesson: true,
        youtubeId: null,
        duration: '20:00',
        taskDescription: 'Запишитесь на УЗИ органов брюшной полости'
      },
      {
        id: 'lab-5',
        slug: 'coprogram',
        title: 'Копрограмма',
        orderIndex: 30,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Сдайте копрограмму и проанализируйте результаты'
      },
      {
        id: 'lab-6',
        slug: 'urinalysis',
        title: 'ОАМ',
        description: 'Общий анализ мочи',
        orderIndex: 31,
        isStopLesson: true,
        youtubeId: null,
        duration: '20:00',
        taskDescription: 'Сдайте ОАМ и изучите свои показатели'
      }
    ]
  },

  // ==========================================
  // МОДУЛЬ 5: Устранение дефицитов (Шаги 32-37)
  // ==========================================
  {
    id: 'deficits',
    slug: 'deficits',
    title: 'Устранение дефицитов',
    description: 'Выявление и восполнение дефицитов витаминов и минералов',
    icon: '💊',
    color: '#E91E63',
    orderIndex: 5,
    lessons: [
      {
        id: 'deficits-1',
        slug: 'deficit-causes',
        title: 'Причины дефицитов',
        orderIndex: 32,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Определите возможные причины ваших дефицитов'
      },
      {
        id: 'deficits-2',
        slug: 'mineral-deficit',
        title: 'Дефицит минералов',
        orderIndex: 33,
        isStopLesson: false,
        youtubeId: null,
        duration: '25:00'
      },
      {
        id: 'deficits-3',
        slug: 'clinical-signs',
        title: 'Клинические признаки дефицитов',
        orderIndex: 34,
        isStopLesson: true,
        youtubeId: null,
        duration: '30:00',
        taskDescription: 'Проверьте себя на клинические признаки дефицитов'
      },
      {
        id: 'deficits-4',
        slug: 'macronutrient-deficit',
        title: 'Дефицит макронутриентов',
        orderIndex: 35,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Оцените достаточность белков, жиров и углеводов'
      },
      {
        id: 'deficits-5',
        slug: 'lab-vitamin-signs',
        title: 'Лабораторные признаки дефицита витаминов',
        orderIndex: 36,
        isStopLesson: true,
        youtubeId: null,
        duration: '30:00',
        taskDescription: 'Сдайте анализы на витамины D, B12, железо'
      },
      {
        id: 'deficits-6',
        slug: 'vitamin-forms',
        title: 'Формы витаминов и минералов',
        orderIndex: 37,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Выберите подходящие формы добавок'
      }
    ]
  },

  // ==========================================
  // МОДУЛЬ 6: Гормональное здоровье (Шаги 38-40)
  // ==========================================
  {
    id: 'hormones',
    slug: 'hormones',
    title: 'Гормональное здоровье',
    description: 'Гормоны мужчин и женщин, щитовидная железа',
    icon: '⚖️',
    color: '#FF5722',
    orderIndex: 6,
    lessons: [
      {
        id: 'hormones-1',
        slug: 'male-hormones',
        title: 'Гормональное здоровье мужчины',
        orderIndex: 38,
        isStopLesson: true,
        youtubeId: null,
        duration: '25:00',
        taskDescription: 'Сдайте анализы на тестостерон и другие гормоны'
      },
      {
        id: 'hormones-2',
        slug: 'female-hormones',
        title: 'Гормональное здоровье женщины',
        orderIndex: 39,
        isStopLesson: false,
        youtubeId: null,
        duration: '30:00'
      },
      {
        id: 'hormones-3',
        slug: 'thyroid-health',
        title: 'Щитовидная железа',
        orderIndex: 40,
        isStopLesson: false,
        youtubeId: null,
        duration: '25:00'
      }
    ]
  }
];

// ==========================================
// БОНУСНЫЕ ПРОГРАММЫ
// ==========================================
export const bonusPrograms = [
  {
    id: 'anti-aging',
    slug: 'anti-aging',
    title: 'Антистарость',
    description: 'Программа замедления старения и восстановления молодости организма',
    image: '/images/programs/anti-aging.jpg',
    isBonus: true
  },
  {
    id: '5r-gut',
    slug: '5r-gut',
    title: 'Программа 5R. Здоровый кишечник',
    description: 'Комплексная программа восстановления кишечника по протоколу 5R',
    image: '/images/programs/5r-gut.jpg',
    isBonus: true
  },
  {
    id: 'real-detox',
    slug: 'real-detox',
    title: 'Реальный детокс',
    description: 'Безопасный детокс без жёстких ограничений и голодания',
    image: '/images/programs/real-detox.jpg',
    isBonus: true
  },
  {
    id: 'grocery-basket',
    slug: 'grocery-basket',
    title: 'Собираем продуктовую корзину',
    description: 'Как выбирать продукты и составлять здоровую продуктовую корзину',
    image: '/images/programs/grocery-basket.jpg',
    isBonus: true
  }
];

// ==========================================
// ХЕЛПЕРЫ
// ==========================================

// Получить общее количество уроков
export const getTotalLessons = () => {
  return learningModules.reduce((acc, module) => acc + module.lessons.length, 0);
};

// Получить модуль по slug
export const getModuleBySlug = (slug) => {
  return learningModules.find(m => m.slug === slug);
};

// Получить урок по slug модуля и урока
export const getLessonBySlug = (moduleSlug, lessonSlug) => {
  const module = getModuleBySlug(moduleSlug);
  return module?.lessons.find(l => l.slug === lessonSlug);
};

// Получить все уроки плоским списком
export const getAllLessons = () => {
  return learningModules.flatMap(module => 
    module.lessons.map(lesson => ({
      ...lesson,
      moduleSlug: module.slug,
      moduleTitle: module.title,
      moduleColor: module.color
    }))
  );
};

// Получить следующий урок
export const getNextLesson = (moduleSlug, lessonSlug) => {
  const allLessons = getAllLessons();
  const currentIndex = allLessons.findIndex(
    l => l.moduleSlug === moduleSlug && l.slug === lessonSlug
  );
  
  if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
    return allLessons[currentIndex + 1];
  }
  return null;
};

// Получить предыдущий урок
export const getPrevLesson = (moduleSlug, lessonSlug) => {
  const allLessons = getAllLessons();
  const currentIndex = allLessons.findIndex(
    l => l.moduleSlug === moduleSlug && l.slug === lessonSlug
  );
  
  if (currentIndex > 0) {
    return allLessons[currentIndex - 1];
  }
  return null;
};
