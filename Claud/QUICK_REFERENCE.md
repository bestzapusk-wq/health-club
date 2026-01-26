# Quick Reference — Быстрая шпаргалка

## 📍 Где что искать

| Хочу изменить... | Файл |
|-----------------|------|
| Главную страницу | `src/pages/MainPage.jsx` |
| Опросник | `src/pages/SurveyPage.jsx` + `src/hooks/useSurvey.js` |
| Вопросы опросника | `src/data/surveyQuestions.js` |
| AI-отчёт | `src/pages/MyReportPage.jsx` |
| Профиль | `src/pages/ProfilePage.jsx` |
| Трекер привычек | `src/components/habits/HabitsTracker.jsx` |
| Таймер голодания | `src/components/fasting/FastingWidget.jsx` |
| Нижнее меню | `src/components/layout/BottomNav.jsx` |
| Курсы/программы данные | `src/data/courses.js`, `src/data/programs.js` |
| Роутинг | `src/App.jsx` |
| Supabase клиент | `src/lib/supabase.ts` |

---

## 🔧 Частые операции

### Добавить новую страницу:
```jsx
// 1. Создать src/pages/NewPage.jsx
// 2. Создать src/pages/NewPage.css
// 3. В App.jsx добавить:
const NewPage = lazy(() => import('./pages/NewPage'));
// И роут:
<Route path="/new" element={<NewPage />} />
```

### Сохранить в Supabase:
```jsx
import { supabase } from '../lib/supabase';

const { data, error } = await supabase
  .from('table_name')
  .insert({ user_id: userId, field: value });
```

### Получить userId:
```jsx
const userData = localStorage.getItem('user_data');
const userId = userData ? JSON.parse(userData).id : null;
```

### Открыть WhatsApp:
```jsx
window.open('https://wa.me/77472370208?text=' + encodeURIComponent(message), '_blank');
```

---

## 📱 localStorage ключи

```js
user_data              // Профиль пользователя
survey_completed       // Опросник пройден (true/false)
upload_completed       // Файлы загружены
data_submitted         // Отправлено на анализ
fasting_settings       // { mode, startTime, isActive }
meal_plan              // Выбранные рецепты
food_tracker           // Дневник питания по дням
health_tracker_data    // { vitamins, daily_data }
```

---

## 🎨 UI компоненты

```jsx
// Кнопка
import Button from '../components/ui/Button';
<Button onClick={fn} variant="ghost" fullWidth loading={isLoading}>
  Текст
</Button>

// Модалка
<div className="modal-overlay" onClick={onClose}>
  <div className="modal" onClick={e => e.stopPropagation()}>
    ...
  </div>
</div>

// Иконки
import { ArrowLeft, Check, X } from 'lucide-react';
<ArrowLeft size={24} />
```

---

## 🚨 Что точно сломано

1. **CoursePage** — кнопки не работают
2. **VitaminsPage** — удаление без confirm
3. **Таблицы голодания** — не созданы в Supabase

---

## ✅ Чеклист перед релизом

- [ ] Создать таблицы fasting_settings, fasting_sessions
- [ ] Исправить CoursePage
- [ ] Исправить VitaminsPage
- [ ] Добавить aria-labels
- [ ] Протестировать на iOS
