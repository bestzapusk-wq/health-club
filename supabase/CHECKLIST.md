# 📋 Чеклист проверки системы анализов

## 1. База данных (Supabase SQL Editor)

### Выполнить SQL скрипт
Откройте `check-tables.sql` и выполните в SQL Editor

### Проверить структуру таблиц
```sql
-- survey_responses должна иметь: id, user_id, answers (jsonb), completed_at
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'survey_responses';

-- uploaded_files должна иметь: id, user_id, file_name, file_type, file_size, file_path
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'uploaded_files';

-- analysis_results должна иметь: id, user_id, status, result_data (jsonb)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analysis_results';
```

### Проверить данные
```sql
-- Есть ли ответы опросника?
SELECT user_id, completed_at, jsonb_pretty(answers) 
FROM survey_responses 
ORDER BY completed_at DESC LIMIT 1;

-- Есть ли загруженные файлы?
SELECT * FROM uploaded_files ORDER BY uploaded_at DESC LIMIT 5;

-- Есть ли результаты анализа?
SELECT user_id, status, completed_at, 
       jsonb_pretty(result_data) as result 
FROM analysis_results;
```

---

## 2. Storage Bucket

### Проверить bucket
1. Открыть Supabase → Storage
2. Должен быть bucket `health-files`
3. Проверить что bucket публичный (для AI доступа)

### Проверить политики Storage
```sql
SELECT * FROM storage.policies WHERE bucket_id = 'health-files';
```

### Проверить файлы
1. Открыть bucket `health-files`
2. Должны быть папки с user_id
3. Внутри папок — файлы анализов

---

## 3. Edge Function

### Проверить деплой
```bash
cd health-club
supabase functions list
# Должна быть функция: analyze-health
```

### Задеплоить функцию (если нет)
```bash
supabase functions deploy analyze-health
```

### Проверить секреты
В Supabase Dashboard → Settings → Edge Functions → Secrets:
- `ANTHROPIC_API_KEY` — ваш API ключ Anthropic
- `SUPABASE_URL` — автоматически доступен
- `SUPABASE_SERVICE_ROLE_KEY` — автоматически доступен

### Установить секрет Anthropic
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx...
```

---

## 4. Тестирование

### Шаг 1: Регистрация
1. Открыть приложение
2. Пройти регистрацию
3. ✅ В `profiles` должна появиться запись

### Шаг 2: Опросник
1. Пройти опросник полностью
2. ✅ В `survey_responses` должна появиться запись с `answers` jsonb

### Шаг 3: Загрузка анализов
1. На главной нажать "Загрузить анализы"
2. Загрузить JPG/PNG файл
3. ✅ В `uploaded_files` должна появиться запись
4. ✅ В Storage bucket должен появиться файл

### Шаг 4: Генерация отчёта
1. Нажать "Получить результаты"
2. ✅ В `analysis_results` должна появиться запись со статусом `processing`
3. Подождать 30-60 секунд
4. ✅ Статус должен измениться на `completed`
5. ✅ `result_data` должен содержать JSON от Claude

### Шаг 5: Отображение
1. Перейти в раздел "Разбор"
2. ✅ Должны отображаться данные из `result_data`

---

## 5. Частые ошибки

### Ошибка 406 (Not Acceptable)
- Неправильный статус в запросе
- Исправлено: ищем `status = 'completed'`

### Ошибка "Function not found"
- Edge Function не задеплоена
- Решение: `supabase functions deploy analyze-health`

### Ошибка "Unauthorized"
- Нет токена авторизации
- Проверить что пользователь залогинен

### Ошибка "ANTHROPIC_API_KEY not set"
- Не установлен секрет
- Решение: `supabase secrets set ANTHROPIC_API_KEY=...`

### Файлы не загружаются
- Нет политик на Storage
- Выполнить SQL для создания политик

### Анализ не генерируется
- Проверить логи Edge Function: Dashboard → Edge Functions → Logs
