import { supabase } from './supabase';
import { ANALYSIS_PROMPT_TEMPLATE } from '../types/analysisResult';

/**
 * Получить все данные пользователя для анализа
 * @param {string} userId - ID пользователя
 * @param {string} profileType - 'self' или 'family'
 * @param {string|null} familyMemberId - ID родственника
 */
export async function getUserDataForAnalysis(userId, profileType = 'self', familyMemberId = null) {
  // 1. Получаем ответы опросника
  const { data: surveyData, error: surveyError } = await supabase
    .from('survey_responses')
    .select('answers, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  if (surveyError) {
    console.error('Error fetching survey:', surveyError);
    throw new Error('Не удалось загрузить данные опросника');
  }

  // 2. Получаем загруженные файлы
  const { data: filesData, error: filesError } = await supabase
    .from('uploaded_files')
    .select('id, file_name, file_type, file_path')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });

  if (filesError) {
    console.error('Error fetching files:', filesError);
    throw new Error('Не удалось загрузить файлы анализов');
  }

  // 3. Получаем публичные URL для файлов
  const filesWithUrls = await Promise.all(
    (filesData || []).map(async (file) => {
      const { data: urlData } = supabase.storage
        .from('health-files')
        .getPublicUrl(file.file_path);

      return {
        ...file,
        publicUrl: urlData?.publicUrl || null
      };
    })
  );

  // 4. Получаем профиль пользователя
  const { data: profileData } = await supabase
    .from('profiles')
    .select('first_name, gender, birth_date, weight_kg, height_cm')
    .eq('id', userId)
    .single();

  return {
    survey: surveyData?.answers || {},
    files: filesWithUrls,
    profile: profileData || {},
    userId
  };
}

/**
 * Подготовить сообщение для Claude API
 */
export function prepareClaudeMessage(userData) {
  const { survey, files, profile } = userData;

  // Формируем контекст опросника
  const surveyContext = {
    profile: {
      name: profile.first_name,
      gender: profile.gender,
      age: profile.birth_date 
        ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear()
        : null,
      weight: profile.weight_kg,
      height: profile.height_cm
    },
    answers: survey
  };

  // Формируем промпт
  const prompt = ANALYSIS_PROMPT_TEMPLATE.replace(
    '{surveyAnswers}',
    JSON.stringify(surveyContext, null, 2)
  );

  // Формируем content array для Claude
  const content = [
    {
      type: "text",
      text: prompt
    }
  ];

  // Добавляем изображения
  const imageFiles = files.filter(f => 
    f.file_type === 'image' && f.publicUrl
  );

  for (const file of imageFiles) {
    content.push({
      type: "image",
      source: {
        type: "url",
        url: file.publicUrl
      }
    });
  }

  // PDF пока пропускаем (нужен отдельный парсер)
  // TODO: Добавить конвертацию PDF в изображения или OCR
  const pdfFiles = files.filter(f => f.file_type === 'pdf');
  if (pdfFiles.length > 0) {
    content[0].text += `\n\n⚠️ Также загружены PDF файлы (${pdfFiles.length} шт.), но их содержимое недоступно для анализа. Названия: ${pdfFiles.map(f => f.file_name).join(', ')}`;
  }

  return {
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [{
      role: "user",
      content
    }]
  };
}

/**
 * Сохранить результат анализа (создаёт новую запись для истории)
 * @param {string} userId - ID пользователя
 * @param {Object} resultData - Результат анализа от Claude
 * @param {string} profileType - 'self' или 'family'
 * @param {string|null} familyMemberId - ID родственника (если profileType === 'family')
 */
export async function saveAnalysisResult(userId, resultData, profileType = 'self', familyMemberId = null) {
  const insertData = {
    user_id: userId,
    status: 'completed',
    result_data: resultData,
    completed_at: new Date().toISOString(),
    profile_type: profileType,
    family_member_id: familyMemberId,
    analysis_date: new Date().toISOString().split('T')[0]
  };

  const { data, error } = await supabase
    .from('analysis_results')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error saving analysis result:', error);
    throw new Error('Не удалось сохранить результат анализа');
  }

  return data;
}

/**
 * Получить результат анализа пользователя
 */
export async function getAnalysisResult(userId) {
  console.log('🔍 [analysisService] getAnalysisResult called with userId:', userId);
  
  if (!userId) {
    console.log('❌ [analysisService] userId is null/undefined');
    return null;
  }
  
  // Сначала проверим ВСЕ записи для этого пользователя (для дебага)
  const { data: allRecords, error: allError } = await supabase
    .from('analysis_results')
    .select('id, user_id, status, created_at')
    .eq('user_id', userId);
  
  console.log('📊 [analysisService] All records for user:', allRecords);
  if (allError) {
    console.log('⚠️ [analysisService] Error fetching all records:', allError);
  }
  
  // Ищем ready ИЛИ completed (Edge Function может использовать разные статусы)
  const { data, error } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['completed', 'ready'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log('📊 [analysisService] Query result:', { data, error });

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('❌ [analysisService] Error fetching analysis result:', error);
    // Не кидаем ошибку, просто возвращаем null
    return null;
  }

  if (!data) {
    console.log('⚠️ [analysisService] No completed analysis found');
  }

  return data;
}

/**
 * Сохранить результат анализа напрямую (для тестирования или внешнего API)
 * @param {string} userId - ID пользователя
 * @param {Object} resultData - JSON с результатом анализа от Claude
 * @param {string} profileType - 'self' или 'family'
 * @param {string|null} familyMemberId - ID родственника
 */
export async function saveAnalysisResultDirect(userId, resultData, profileType = 'self', familyMemberId = null) {
  // Добавляем метаданные
  const enrichedData = {
    ...resultData,
    meta: {
      ...resultData.meta,
      savedAt: new Date().toISOString(),
      source: 'direct_save'
    }
  };

  const { data, error } = await supabase
    .from('analysis_results')
    .insert({
      user_id: userId,
      status: 'completed',
      result_data: enrichedData,
      completed_at: new Date().toISOString(),
      profile_type: profileType,
      family_member_id: familyMemberId,
      analysis_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving analysis result:', error);
    throw new Error('Не удалось сохранить результат анализа');
  }

  return data;
}

/**
 * Получить историю разборов для профиля
 * @param {string} userId - ID пользователя
 * @param {string} profileType - 'self' или 'family'
 * @param {string|null} familyMemberId - ID родственника (если profileType === 'family')
 * @returns {Promise<Array>} Массив разборов отсортированных по дате (новые первые)
 */
export async function getAnalysisHistory(userId, profileType = 'self', familyMemberId = null) {
  let query = supabase
    .from('analysis_results')
    .select('id, created_at, result_data, status, profile_type, family_member_id')
    .eq('user_id', userId)
    .in('status', ['completed', 'ready']);
  
  // Фильтрация по типу профиля
  if (profileType === 'family' && familyMemberId) {
    query = query.eq('family_member_id', familyMemberId);
  } else {
    // Для 'self' - записи без family_member_id или с profile_type = 'self'
    query = query.or('family_member_id.is.null,profile_type.eq.self');
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching analysis history:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Получить разбор для конкретного профиля (последний)
 * @param {string} userId - ID пользователя
 * @param {string} profileType - 'self' или 'family'
 * @param {string|null} familyMemberId - ID родственника
 * @returns {Promise<Object|null>} Последний разбор или null
 */
export async function getAnalysisForProfile(userId, profileType = 'self', familyMemberId = null) {
  let query = supabase
    .from('analysis_results')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['completed', 'ready']);
  
  // Фильтрация по типу профиля
  if (profileType === 'family' && familyMemberId) {
    query = query.eq('family_member_id', familyMemberId);
  } else {
    query = query.or('family_member_id.is.null,profile_type.eq.self');
  }
  
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching analysis for profile:', error);
    return null;
  }
  
  return data;
}

/**
 * Получить разбор по ID
 * @param {string} analysisId - ID разбора
 * @returns {Promise<Object|null>} Разбор или null
 */
export async function getAnalysisById(analysisId) {
  const { data, error } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('id', analysisId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching analysis by id:', error);
    throw error;
  }
  
  return data;
}

/**
 * Пример использования (для Edge Function или сервера):
 * 
 * import Anthropic from '@anthropic-ai/sdk';
 * 
 * const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 * 
 * async function runAnalysis(userId) {
 *   // 1. Получаем данные
 *   const userData = await getUserDataForAnalysis(userId);
 *   
 *   // 2. Готовим запрос
 *   const request = prepareClaudeMessage(userData);
 *   
 *   // 3. Вызываем Claude
 *   const response = await anthropic.messages.create(request);
 *   
 *   // 4. Парсим JSON из ответа
 *   const resultText = response.content[0].text;
 *   const resultData = JSON.parse(resultText);
 *   
 *   // 5. Добавляем метаданные
 *   resultData.meta = {
 *     ...resultData.meta,
 *     generatedAt: new Date().toISOString(),
 *     model: request.model
 *   };
 *   
 *   // 6. Сохраняем результат
 *   await saveAnalysisResult(userId, resultData);
 *   
 *   return resultData;
 * }
 */
