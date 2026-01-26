import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    });

    const { todayReport, context } = await req.json();
    const { reports, profile, priorities, mainFinding } = context;

    // Формируем контекст для AI
    const systemPrompt = `Ты — заботливый health-коуч в приложении Health Club. 
Твоя задача — дать короткую персональную обратную связь по дневному отчёту пользователя.

ПРАВИЛА:
1. Максимум 2-3 предложения основного текста
2. Можешь добавить 1 короткий совет (tip) если уместно
3. Обращайся по имени
4. Связывай с приоритетами здоровья если это уместно
5. Замечай тренды (если данные за несколько дней)
6. Будь тёплым, но не слащавым
7. Давай конкретику, не общие фразы
8. Отвечай на русском языке

ФОРМАТ ОТВЕТА (JSON):
{
  "message": "Основной текст фидбека",
  "tip": "Короткий совет (опционально, может быть null)"
}`;

    // Формируем данные для промпта
    const reportsHistory = (reports || []).map((r: any) => 
      `${r.report_date}: вода ${r.water_ml}мл, активность ${r.activity_minutes}мин, сон ${r.sleep_hours}ч`
    ).join('\n');

    const prioritiesList = (priorities || []).map((p: any, i: number) => 
      `${i + 1}. ${p.title || p.action}: ${p.description || p.reason || ''}`
    ).join('\n');

    const userName = profile?.name || 'Пользователь';
    const userAge = profile?.age || 'неизвестно';
    const userGender = profile?.gender === 'male' ? 'мужчина' : 'женщина';

    const userPrompt = `
ПОЛЬЗОВАТЕЛЬ: ${userName}, ${userAge} лет, ${userGender}

СЕГОДНЯШНИЙ ОТЧЁТ:
- Вода: ${todayReport.water_ml || 0} мл
- Активность: ${todayReport.activity_minutes || 0} минут
- Сон: ${todayReport.sleep_hours || 0} часов

ИСТОРИЯ ЗА ПОСЛЕДНИЕ 7 ДНЕЙ:
${reportsHistory || 'Нет данных'}

ГЛАВНАЯ НАХОДКА ИЗ РАЗБОРА ЗДОРОВЬЯ:
${mainFinding || 'Нет данных'}

ПРИОРИТЕТЫ ЗДОРОВЬЯ:
${prioritiesList || 'Нет данных'}

Дай персональную обратную связь.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Самая быстрая и дешёвая модель
      max_tokens: 300,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    });

    // Парсим ответ
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    let feedback;
    try {
      // Пробуем распарсить JSON
      // Убираем возможный markdown
      const cleanText = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      feedback = JSON.parse(cleanText);
    } catch {
      // Если не JSON, используем как текст
      feedback = {
        message: content.text,
        tip: null
      };
    }

    return new Response(JSON.stringify(feedback), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating feedback:', error);
    
    // Fallback ответ
    return new Response(JSON.stringify({
      message: 'Отчёт сохранён! Продолжай отслеживать свои привычки.',
      tip: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
