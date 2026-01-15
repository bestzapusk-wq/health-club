import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Промпт для Claude
const ANALYSIS_PROMPT = `
Ты — опытный врач-диагност. Проанализируй данные опросника и результаты анализов.

## Данные пользователя:
{userData}

## Инструкции:
1. Изучи все приложенные изображения анализов
2. Сопоставь результаты анализов с симптомами из опросника
3. Найди причинно-следственные связи между показателями
4. Выдели 3 главные проблемы
5. Составь план приоритетных действий

## Формат ответа:
Верни ТОЛЬКО валидный JSON без markdown-разметки:

{
  "stats": { "critical": число, "warning": число, "normal": число },
  "summary": "Краткое резюме в 1-2 предложения",
  "mainFindings": [
    {
      "num": 1,
      "title": "Название проблемы",
      "status": "critical или warning",
      "description": "Подробное описание",
      "symptoms": ["Симптом 1", "Симптом 2"]
    }
  ],
  "connectionChain": [
    { "text": "Причина", "type": "critical" },
    { "text": "Следствие", "type": "warning" },
    { "text": "Результат", "type": "result" }
  ],
  "goodNews": ["Что в порядке 1", "Что в порядке 2"],
  "keyIndicators": [
    {
      "name": "Показатель",
      "value": 36.1,
      "unit": "ед.",
      "status": "critical/warning/normal",
      "ref": "норма X-Y"
    }
  ],
  "detailSections": [
    {
      "id": "section1",
      "icon": "🔬",
      "title": "Название раздела",
      "badge": "Статус",
      "badgeType": "critical/warning/normal",
      "content": "Описание с <strong>HTML</strong>",
      "symptoms": ["Симптом"]
    }
  ],
  "priorities": [
    { "num": 1, "title": "Приоритет", "desc": "Что делать" }
  ],
  "additionalTests": ["Анализ 1", "Анализ 2"]
}

ВАЖНО:
- Пиши на русском языке
- Используй простой язык, понятный пациенту
- Связывай находки с симптомами из опросника
- Это НЕ диагноз, а помощь в понимании результатов
`;

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Получаем user_id из запроса
    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error("user_id is required");
    }

    // Инициализируем клиенты
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    console.log(`📊 Starting analysis for user: ${user_id}`);

    // 1. Обновляем статус на "processing"
    await supabase
      .from("analysis_results")
      .upsert({
        user_id,
        status: "processing",
        result_data: null,
        completed_at: null,
      }, { onConflict: "user_id" });

    // 2. Получаем данные опросника
    const { data: surveyData, error: surveyError } = await supabase
      .from("survey_responses")
      .select("answers, completed_at")
      .eq("user_id", user_id)
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();

    if (surveyError) {
      console.error("Survey error:", surveyError);
    }

    // 3. Получаем профиль
    const { data: profileData } = await supabase
      .from("profiles")
      .select("first_name, gender, birth_date, weight_kg, height_cm")
      .eq("id", user_id)
      .single();

    // 4. Получаем файлы
    const { data: filesData } = await supabase
      .from("uploaded_files")
      .select("file_name, file_type, file_path")
      .eq("user_id", user_id)
      .order("uploaded_at", { ascending: false });

    // 5. Получаем публичные URL
    const imageUrls: string[] = [];
    for (const file of filesData || []) {
      if (file.file_type === "image") {
        const { data: urlData } = supabase.storage
          .from("health-files")
          .getPublicUrl(file.file_path);
        if (urlData?.publicUrl) {
          imageUrls.push(urlData.publicUrl);
        }
      }
    }

    console.log(`📁 Found ${imageUrls.length} images`);

    // 6. Формируем данные пользователя
    const userData = {
      profile: {
        name: profileData?.first_name || "Пользователь",
        gender: profileData?.gender,
        age: profileData?.birth_date
          ? new Date().getFullYear() - new Date(profileData.birth_date).getFullYear()
          : null,
        weight_kg: profileData?.weight_kg,
        height_cm: profileData?.height_cm,
      },
      surveyAnswers: surveyData?.answers || {},
      filesCount: {
        images: imageUrls.length,
        pdfs: (filesData || []).filter((f) => f.file_type === "pdf").length,
      },
    };

    // 7. Формируем запрос к Claude
    const prompt = ANALYSIS_PROMPT.replace(
      "{userData}",
      JSON.stringify(userData, null, 2)
    );

    const content: any[] = [{ type: "text", text: prompt }];

    // Добавляем изображения
    for (const url of imageUrls) {
      content.push({
        type: "image",
        source: { type: "url", url },
      });
    }

    console.log(`🤖 Calling Claude with ${content.length} content items...`);

    // 8. Вызываем Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [{ role: "user", content }],
    });

    // 9. Парсим ответ
    const responseText = response.content[0].type === "text" 
      ? response.content[0].text 
      : "";
    
    // Убираем возможные markdown-обёртки
    let jsonText = responseText.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const resultData = JSON.parse(jsonText);

    // 10. Добавляем метаданные
    resultData.meta = {
      generatedAt: new Date().toISOString(),
      model: "claude-sonnet-4-20250514",
      imagesAnalyzed: imageUrls.length,
      confidence: resultData.meta?.confidence || "medium",
    };

    console.log(`✅ Analysis complete!`);

    // 11. Сохраняем результат
    const { error: saveError } = await supabase
      .from("analysis_results")
      .upsert({
        user_id,
        status: "completed",
        result_data: resultData,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (saveError) {
      console.error("Save error:", saveError);
      throw saveError;
    }

    return new Response(
      JSON.stringify({ success: true, data: resultData }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error:", error);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
