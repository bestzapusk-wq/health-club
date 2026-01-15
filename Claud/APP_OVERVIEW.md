# Обзор приложения Health Club

## Общая информация

**Название:** Health Club
**Тип:** Мобильное веб-приложение (PWA)
**Назначение:** Персонализированный мониторинг здоровья с AI-анализом
**Стек:** React 19 + Vite + Supabase + Claude API

---

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Регист- │ │ Опрос-  │ │ AI-     │ │ Трекеры │       │
│  │ рация   │ │ ник     │ │ Разбор  │ │         │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │  Auth   │ │ Postgre │ │ Storage │ │  Edge   │       │
│  │         │ │   SQL   │ │ (files) │ │Functions│       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Claude API                            │
│  ┌─────────────────────────────────────────────┐       │
│  │  Анализ здоровья  │  Анализ фото еды       │       │
│  └─────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## Структура страниц

### Публичные
| Путь | Страница | Описание |
|------|----------|----------|
| `/register` | RegisterPage | Регистрация и вход |

### Авторизованные
| Путь | Страница | Описание |
|------|----------|----------|
| `/` | MainPage | Главная с прогрессом и трекерами |
| `/survey` | SurveyPage | Опросник здоровья |
| `/report` | MyReportPage | AI-разбор здоровья |
| `/food` | FoodPage | Дневник питания |
| `/food/plan` | MealPlanPage | Планировщик питания (swipe) |
| `/food/recipes` | RecipesPage | Каталог рецептов |
| `/food/shopping` | ShoppingPage | Список покупок (заглушка) |
| `/food/diary` | DiaryPage | (не используется) |
| `/food/saved` | SavedPage | Сохранённые рецепты (заглушка) |
| `/materials` | MaterialsPage | Образовательный контент |
| `/program/:id` | ProgramDetailPage | Детали платной программы |
| `/course/:id` | CoursePage | Страница курса (заглушка) |
| `/vitamins` | VitaminsPage | Трекер витаминов |
| `/profile` | ProfilePage | Профиль пользователя |

---

## Структура базы данных (Supabase)

### Таблица: profiles
```sql
id              UUID PRIMARY KEY (= auth.users.id)
first_name      TEXT
gender          TEXT ('male' | 'female')
birth_date      DATE
weight_kg       INTEGER
height_cm       INTEGER
phone           TEXT
survey_completed BOOLEAN
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Таблица: survey_responses
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES profiles(id)
answers         JSONB -- все ответы опросника
completed_at    TIMESTAMP
created_at      TIMESTAMP
```

### Таблица: uploaded_files
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES profiles(id)
file_name       TEXT
file_type       TEXT
file_size       INTEGER
file_path       TEXT -- путь в Storage
uploaded_at     TIMESTAMP
```

### Таблица: analysis_results
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES profiles(id) UNIQUE
status          TEXT ('processing' | 'completed' | 'error')
result_data     JSONB -- результат от Claude
error_message   TEXT
started_at      TIMESTAMP
completed_at    TIMESTAMP
created_at      TIMESTAMP
```

### Таблица: daily_reports
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES profiles(id)
report_date     DATE
water_ml        INTEGER
activity_minutes INTEGER
sleep_hours     INTEGER
submitted_at    TIMESTAMP
updated_at      TIMESTAMP
UNIQUE(user_id, report_date)
```

### Таблица: recipes (Supabase)
```sql
id              UUID PRIMARY KEY
name            TEXT
description     TEXT
image           TEXT
meal            TEXT ('breakfast' | 'lunch' | 'dinner' | 'snack')
time            INTEGER (минуты)
calories        INTEGER
tags            TEXT[]
ingredients     JSONB
steps           JSONB
created_at      TIMESTAMP
```

---

## Ключевые компоненты

### Компоненты UI (`/components/ui/`)
- `Button.jsx` — кнопка с вариантами
- `Card.jsx` — карточка
- `Input.jsx` — поле ввода
- `Modal.jsx` — модальное окно
- `ProgressBar.jsx` — прогресс-бар

### Компоненты Layout (`/components/layout/`)
- `Header.jsx` — шапка с именем пользователя
- `BottomNav.jsx` — нижняя навигация (5 табов)

### Компоненты опросника (`/components/survey/`)
- `QuestionCard.jsx` — обёртка вопроса
- `YesNoButtons.jsx` — да/нет кнопки с картинкой
- `SingleSelect.jsx` — выбор одного варианта
- `MultiSelect.jsx` — мультивыбор
- `TextareaQuestion.jsx` — текстовое поле
- `SectionIntro.jsx` — заголовок секции
- `SurveyHeader.jsx` — прогресс опросника
- `CompletionScreen.jsx` — экран завершения

### Компоненты привычек (`/components/habits/`)
- `HabitsTracker.jsx` — основной трекер (вода, активность, сон)
- `WaterTracker.jsx` — (устарел, объединён)
- `SleepTracker.jsx` — (устарел, объединён)
- `ActivityTracker.jsx` — (устарел, объединён)

### Компоненты еды (`/components/food/`)
- `AddFoodModal.jsx` — модалка добавления еды
- `FoodAnalysisModal.jsx` — модалка разбора еды
- `FoodLogModal.jsx` — (не используется)

---

## Сервисы (`/lib/`)

### supabase.ts
Клиент Supabase с настройками

### generateReport.js
Вызов Edge Function для AI-анализа здоровья

### analysisService.js
Получение и обработка результатов анализа

### foodAnalysisService.js
AI-анализ фото еды через Claude

### recipesService.js
Загрузка рецептов из Supabase

---

## Данные (`/data/`)

### surveyQuestions.js
45+ вопросов опросника с типами и фильтрацией по полу

### programs.js
3 платные программы (желудок, желчный, кишечник)

### materials.js
Контент: семинары, эфиры, видео

### dailyTasks.js
Ежедневные задания (устарело, частично используется)

### recipes.js
Встроенные рецепты (fallback)

---

## Edge Functions (Supabase)

### generate-report/index.ts
**Назначение:** Генерация AI-разбора здоровья

**Входные данные:**
- user_id

**Процесс:**
1. Получить профиль пользователя
2. Получить ответы опросника
3. Получить и скачать файлы анализов
4. Конвертировать файлы в base64
5. Отправить в Claude API с системным промптом
6. Распарсить JSON-ответ
7. Сохранить в analysis_results

**Выходные данные:**
- JSON с разбором (stats, mainFindings, connectionChain, priorities, etc.)

---

## Статус реализации

### Готово (✅)
- Регистрация/авторизация
- Опросник здоровья
- Загрузка анализов
- AI-генерация разбора
- Отображение разбора
- Трекер привычек
- Дневник питания с AI
- План питания (swipe)
- Материалы и программы
- Трекер витаминов
- Профиль со статистикой

### В процессе (⏳)
- PWA (установка)
- Push-уведомления
- Оплата программ
- Список покупок
- Сохранённые рецепты

### Планируется (📋)
- Подписка Premium
- Интеграция с фитнес-трекерами
- Казахский язык
- Чат поддержки
- Реферальная система

---

## Переменные окружения

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# Edge Functions (Supabase Secrets)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-xxx
```

---

## Команды разработки

```bash
# Запуск dev-сервера
cd health-club
npm run dev

# Сборка
npm run build

# Деплой Edge Functions
supabase functions deploy generate-report

# Просмотр логов
supabase functions logs generate-report
```

---

*Обновлено: Январь 2026*
