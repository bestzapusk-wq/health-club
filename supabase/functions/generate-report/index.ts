import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANALYSIS_SYSTEM_PROMPT = `Ты — опытный врач-диагност и нутрициолог. Твоя задача — проанализировать результаты опросника о симптомах и лабораторные анализы пациента.

На основе предоставленных данных создай структурированный JSON-отчёт.

ВАЖНО:
- Анализируй ВСЕ предоставленные данные: и опросник, и лабораторные анализы
- Выявляй связи между симптомами и показателями анализов
- Приоритизируй проблемы по важности
- Давай конкретные, персонализированные рекомендации
- Пиши на русском языке, понятным для пациента

Верни ТОЛЬКО валидный JSON без markdown-форматирования.`;

const RESPONSE_FORMAT = `
Верни JSON строго в таком формате:
{
  "stats": { "critical": 2, "warning": 5, "normal": 10 },
  "summary": "Краткое резюме состояния здоровья (2-3 предложения)",
  "mainFindings": [
    {
      "num": 1,
      "title": "Название проблемы",
      "status": "critical",
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
      "value": "36.1",
      "unit": "ед.",
      "status": "critical",
      "ref": "норма X-Y"
    }
  ],
  "detailSections": [
    {
      "id": "section1",
      "icon": "🔬",
      "title": "Название раздела",
      "badge": "Статус",
      "badgeType": "critical",
      "content": "Описание",
      "symptoms": ["Симптом"]
    }
  ],
  "priorities": [
    { "num": 1, "title": "Приоритет", "desc": "Что делать" }
  ]
}`;

const QUESTIONNAIRE_MAPPING: Record<string, string> = {
  s1: "Вздутие живота после еды",
  s2: "Газообразование",
  s3: "Отрыжка после еды",
  s4: "Изжога",
  s5: "Тяжесть в желудке",
  s6: "Запоры",
  s7: "Диарея",
  s8: "Чередование запоров и диареи",
  s9: "Непереваренная пища в стуле",
  s10: "Слизь в стуле",
  s11: "Боли в животе",
  s12: "Тошнота",
  s13: "Налёт на языке",
  s14: "Неприятный запах изо рта",
  s15: "Кожные высыпания",
  s16: "Усталость после еды",
  s17: "Хроническая усталость",
  s18: "Сонливость днём",
  s19: "Головные боли",
  s20: "Туман в голове",
  s21: "Проблемы с памятью",
  s22: "Раздражительность",
  s23: "Тревожность",
  s24: "Плохой сон",
  s25: "Выпадение волос",
  s26: "Ломкость ногтей",
  s27: "Сухость кожи",
  s28: "Отёки",
  s29: "Боли в суставах",
  s30: "Мышечные боли",
  s31: "Частые простуды",
  s32: "Аллергии",
  s33: "Пищевая непереносимость",
  s34: "Тяга к сладкому",
  s35: "Тяга к солёному",
  s36: "Набор веса",
  s37: "Сложности со снижением веса",
  l1: "Сколько воды пьёте в день",
  l2: "Сколько часов спите",
  l3: "Как часто занимаетесь спортом",
  l4: "Курите ли вы",
  q1: "Возраст",
  q2: "Рост",
  q3: "Менструальный цикл",
  q4: "Приём препаратов",
  q5: "Особые состояния",
  q6: "Дополнительная информация"
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 32768;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

function getMediaType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() || '';
  const types: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
  };
  return types[ext] || 'application/octet-stream';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Получаем данные опросника
    const { data: surveyData, error: surveyError } = await supabase
      .from("survey_responses")
      .select("*")
      .eq("user_id", user_id)
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();

    if (surveyError) console.error("Survey error:", surveyError);

    // 2. Получаем профиль
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    if (profileError) console.error("Profile error:", profileError);

    // 3. Получаем файлы
    const { data: filesData, error: filesError } = await supabase
      .from("uploaded_files")
      .select("*")
      .eq("user_id", user_id);

    if (filesError) console.error("Files error:", filesError);

    // 4. Скачиваем и конвертируем файлы
    const fileContents: Array<{ name: string; type: string; base64: string }> = [];
    
    if (filesData && filesData.length > 0) {
      console.log(`Processing ${filesData.length} files...`);
      
      for (const file of filesData) {
        try {
          if (file.file_size && file.file_size > MAX_FILE_SIZE) {
            console.log(`Skipping file ${file.file_name}: too large`);
            continue;
          }

          const filePath = file.file_path || file.storage_path;
          if (!filePath) continue;

          console.log(`Downloading file: ${filePath}`);
          
          const { data: fileBytes, error: downloadError } = await supabase
            .storage
            .from("health-files")
            .download(filePath);
          
          if (downloadError) {
            console.error(`Download error for ${file.file_name}:`, downloadError);
            continue;
          }

          const arrayBuffer = await fileBytes.arrayBuffer();
          if (arrayBuffer.byteLength > MAX_FILE_SIZE) continue;

          const base64 = arrayBufferToBase64(arrayBuffer);
          const mediaType = getMediaType(file.file_name || filePath);
          
          fileContents.push({ name: file.file_name || filePath, type: mediaType, base64 });
          console.log(`Successfully processed: ${file.file_name}, type: ${mediaType}`);
        } catch (e) {
          console.error(`Error processing file ${file.file_name}:`, e);
        }
      }
    }

    console.log(`Total files processed: ${fileContents.length}`);

    // 5. Форматируем данные опросника
    let formattedQuestionnaire = "Данные опросника отсутствуют";
    
    if (surveyData?.answers) {
      const answers = surveyData.answers;
      const symptomsPresent: string[] = [];
      const symptomsAbsent: string[] = [];
      const lifestyle: string[] = [];
      const additional: string[] = [];

      for (const [key, value] of Object.entries(answers)) {
        const questionText = QUESTIONNAIRE_MAPPING[key] || key;
        
        if (key.startsWith("s")) {
          if (value === true) symptomsPresent.push(questionText);
          else symptomsAbsent.push(questionText);
        } else if (key.startsWith("l")) {
          lifestyle.push(`${questionText}: ${value}`);
        } else if (key.startsWith("q")) {
          additional.push(`${questionText}: ${JSON.stringify(value)}`);
        }
      }

      formattedQuestionnaire = `
ПРИСУТСТВУЮЩИЕ СИМПТОМЫ:
${symptomsPresent.map(s => `- ${s}`).join("\n")}

ОТСУТСТВУЮЩИЕ СИМПТОМЫ:
${symptomsAbsent.map(s => `- ${s}`).join("\n")}

ОБРАЗ ЖИЗНИ:
${lifestyle.map(l => `- ${l}`).join("\n")}

ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:
${additional.map(a => `- ${a}`).join("\n")}
`;
    }

    // 6. Форматируем профиль
    let patientProfile = "";
    if (profileData) {
      patientProfile = `
ПРОФИЛЬ ПАЦИЕНТА:
- Имя: ${profileData.first_name || "Не указано"}
- Пол: ${profileData.gender || "Не указан"}
- Дата рождения: ${profileData.birth_date || "Не указана"}
- Вес: ${profileData.weight_kg || "Не указан"} кг
- Рост: ${profileData.height_cm || "Не указан"} см
`;
    }

    // 7. Формируем контент для Claude
    const userContent: any[] = [
      {
        type: "text",
        text: `Проанализируй данные пациента и создай подробный отчёт о состоянии здоровья.

${patientProfile}

${formattedQuestionnaire}

${fileContents.length > 0 ? `К сообщению прикреплено ${fileContents.length} файл(ов) с лабораторными анализами. Извлеки из них все показатели и включи в анализ.` : "Лабораторные анализы не загружены."}

${RESPONSE_FORMAT}`
      }
    ];

    // Добавляем файлы
    for (const file of fileContents) {
      if (file.type === "application/pdf") {
        userContent.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: file.base64 }
        });
      } else if (file.type.startsWith("image/")) {
        userContent.push({
          type: "image",
          source: { type: "base64", media_type: file.type, data: file.base64 }
        });
      }
    }

    // 8. Отправляем в Claude
    console.log("Sending request to Claude API...");
    
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: ANALYSIS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", errorText);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const analysisText = claudeData.content[0].text;
    
    console.log("Received response from Claude, parsing JSON...");

    // 9. Парсим JSON
    let analysisResult;
    try {
      let cleanText = analysisText;
      if (cleanText.includes("```json")) {
        cleanText = cleanText.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      }
      if (cleanText.includes("```")) {
        cleanText = cleanText.replace(/```\s*/g, "");
      }
      
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      throw new Error("Failed to parse Claude response as JSON");
    }

    // 10. Сохраняем результат — UPSERT вместо INSERT!
    const { data: savedReport, error: saveError } = await supabase
      .from("analysis_results")
      .upsert({
        user_id: user_id,
        status: "completed",
        result_data: analysisResult,
        completed_at: new Date().toISOString(),
        created_by: "ai-analysis"
      }, { onConflict: "user_id" })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      throw new Error(`Failed to save report: ${saveError.message}`);
    }

    console.log("Report saved successfully:", savedReport.id);

    return new Response(
      JSON.stringify({
        success: true,
        report_id: savedReport.id,
        result: analysisResult
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
